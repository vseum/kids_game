"""Озвучка игры клонированным голосом (F5-TTS, русская модель).

Нужен образец голоса: 10–12 секунд чистой речи (wav/mp3). Текст образца можно дать, иначе он распознается сам.
На видеокарте (Google Colab, T4) вся игра озвучивается за 10–20 минут; на процессоре — часы.

    pip install f5-tts ruaccent soundfile
    python tools/f5_voice.py --ref obrazec.wav --name azat [--ref-text "Текст образца."] [--missing] [id ...]

Файлы ложатся в voice/<name>/*.mp3 + manifest.json, как у tools/tts.py.
Модели: misha — Misha24-10/F5-TTS_RUSSIAN (CC BY-NC 4.0), espeech — ESpeech/ESpeech-TTS-1_RL-V2 (Apache 2.0).
"""
import argparse
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / "voice"
_spec = importlib.util.spec_from_file_location("tts", Path(__file__).with_name("tts.py"))
tts = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tts)

MODELS = {
    "misha": ("Misha24-10/F5-TTS_RUSSIAN", "F5TTS_v1_Base_v2/model_last_inference.safetensors", "F5TTS_v1_Base/vocab.txt"),
    "espeech": ("ESpeech/ESpeech-TTS-1_RL-V2", "espeech_tts_rlv2.pt", "vocab.txt"),
}
# что расстановщик ударений путает в наших текстах
FIX = {r"([Нн])\+ёб": r"\1+еб", r"([Сс])амо\+ё(?!\w)": r"\1+амое", r"([Пп])\+однял": r"\1одн+ял"}


def patch_audio_and_onnx():
    import numpy as np
    import soundfile as sf
    import torch
    import torchaudio

    def load(path, *a, **k):   # новая torchaudio читает через torchcodec, которого часто нет
        data, sr = sf.read(str(path), dtype="float32", always_2d=True)
        return torch.from_numpy(data.T.copy()), sr
    torchaudio.load = load

    import onnxruntime as ort
    run = ort.InferenceSession.run

    def run_fixed(self, names, feed, *a, **k):   # модели RUAccent просят token_type_ids, а токенизатор их не даёт
        need = {i.name for i in self.get_inputs()}
        if "token_type_ids" in need and "token_type_ids" not in feed and "input_ids" in feed:
            feed = dict(feed, token_type_ids=np.zeros_like(feed["input_ids"]))
        return run(self, names, feed, *a, **k)
    ort.InferenceSession.run = run_fixed


class Stress:
    """Ударения: RUAccent для обычных слов, наш словарь tts.STRESS поверх (арабские слова, имена)."""

    def __init__(self):
        try:
            from ruaccent import RUAccent
            self.acc = RUAccent()
            self.acc.load(omograph_model_size="turbo", use_dictionary=True)
        except Exception as e:   # без RUAccent модель ставит ударения сама, хуже, но работает
            print("RUAccent недоступен:", e, file=sys.stderr)
            self.acc = None
        self.ours = [(re.compile(r"(?<![\w+])" + r"\+?".join(map(re.escape, w)) + r"(?![\w+])"), s) for w, s in tts.STRESS.items()]

    def __call__(self, text):
        text = tts.prepare(text, stress=False)
        if self.acc:
            text = self.acc.process_all(text)
        for rx, s in self.ours:
            text = rx.sub(s, text)
        for a, b in FIX.items():
            text = re.sub(r"(?<![\w+])" + a, b, text)
        return text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default="", help="образец голоса, 10–12 с")
    ap.add_argument("--ref-text", default="", help="точный текст образца; без него F5 обрежет образец до 12 с и распознает сам")
    ap.add_argument("--name", required=True, help="папка голоса: voice/<name>")
    ap.add_argument("--model", default="misha", choices=list(MODELS))
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--nfe", type=int, default=32, help="шаги генерации: больше — чище, но дольше")
    ap.add_argument("--missing", action="store_true")
    ap.add_argument("--dry", action="store_true", help="только показать тексты с ударениями")
    ap.add_argument("ids", nargs="*")
    args = ap.parse_args()

    if not args.ref and not args.dry:
        sys.exit("Нужен образец голоса: --ref obrazec.wav")
    lines = tts.load_lines()
    ids = args.ids or list(lines)
    patch_audio_and_onnx()
    stress = Stress()
    if args.dry:
        for i in ids:
            print(i, "|", stress(lines[i]))
        return

    import numpy as np
    import soundfile as sf
    from huggingface_hub import hf_hub_download
    from f5_tts.infer.utils_infer import infer_process, load_model, load_vocoder, preprocess_ref_audio_text
    from f5_tts.model import DiT

    repo, ckpt, vocab = MODELS[args.model]
    cfg = dict(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4)
    model = load_model(DiT, cfg, hf_hub_download(repo, ckpt), vocab_file=hf_hub_download(repo, vocab))
    vocoder = load_vocoder()
    ref_audio, ref_text = preprocess_ref_audio_text(args.ref, args.ref_text)
    ref_text = stress(ref_text)
    print("Образец:", ref_text, flush=True)

    out_dir = VOICE / args.name
    out_dir.mkdir(parents=True, exist_ok=True)
    for n, key in enumerate(ids, 1):
        out = out_dir / f"{key}.mp3"
        if args.missing and out.exists():
            continue
        wav, sr, _ = infer_process(ref_audio, ref_text, stress(lines[key]), model, vocoder, nfe_step=args.nfe, speed=args.speed)
        pad = np.zeros(int(sr * 0.25), dtype=np.float32)
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            sf.write(tmp.name, np.concatenate([pad, np.asarray(wav, dtype=np.float32), pad]), sr)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                            "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)
        print(f"[{args.name} {n}/{len(ids)}] {key}", flush=True)

    have = sorted(p.stem for p in out_dir.glob("*.mp3") if p.stem in lines)
    (out_dir / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
