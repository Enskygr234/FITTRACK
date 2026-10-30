#!/usr/bin/env python3
"""
FITTRACK — Egzersiz veritabanı üretici

Free Exercise DB (https://github.com/yuhonas/free-exercise-db, kamu malı / Unlicense)
verisini FITTRACK formatına çevirir ve js/exercises-db.js dosyasını üretir.
Kategori, kas grubu, ekipman ve seviye bilgileri Türkçeleştirilir.

Kullanım:
  python3 tools/build-exercise-db.py <free-exercise-db klasörü> [--thumbs]
  --thumbs: assets/img/th/ altına 200x200 küçük resimleri de üretir (Pillow gerekir)
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Uygulamadaki Türkçe içerikli 28 temel egzersizin veritabanındaki karşılıkları (tekrar eklenmez)
CORE = {
    'Barbell_Bench_Press_-_Medium_Grip', 'Incline_Dumbbell_Press', 'Pushups', 'Cable_Crossover',
    'Dips_-_Chest_Version', 'Wide-Grip_Lat_Pulldown', 'Bent_Over_Barbell_Row', 'Seated_Cable_Rows',
    'Pullups', 'Barbell_Deadlift', 'Dumbbell_Shoulder_Press', 'Side_Lateral_Raise', 'Face_Pull',
    'Dumbbell_Bicep_Curl', 'Hammer_Curls', 'Standing_Dumbbell_Triceps_Extension', 'Triceps_Pushdown',
    'Barbell_Squat', 'Leg_Press', 'Romanian_Deadlift', 'Dumbbell_Lunges', 'Leg_Extensions',
    'Lying_Leg_Curls', 'Barbell_Hip_Thrust', 'Standing_Calf_Raises', 'Plank', 'Hanging_Leg_Raise',
    'Cable_Crunch'
}

GROUP_BY_MUSCLE = {
    'chest': 'Göğüs', 'lats': 'Sırt', 'middle back': 'Sırt', 'lower back': 'Sırt', 'traps': 'Sırt',
    'shoulders': 'Omuz', 'neck': 'Omuz', 'biceps': 'Kol', 'triceps': 'Kol', 'forearms': 'Kol',
    'quadriceps': 'Bacak', 'hamstrings': 'Bacak', 'glutes': 'Bacak', 'calves': 'Bacak',
    'adductors': 'Bacak', 'abductors': 'Bacak', 'abdominals': 'Karın'
}
MUSCLE_KEYS = {
    'chest': ['chest'], 'lats': ['lats'], 'middle back': ['traps', 'lats'], 'lower back': ['lowerBack'],
    'traps': ['traps'], 'shoulders': ['frontDelt', 'sideDelt'], 'neck': ['traps'], 'biceps': ['biceps'],
    'triceps': ['triceps'], 'forearms': ['forearms'], 'quadriceps': ['quads'], 'hamstrings': ['hamstrings'],
    'glutes': ['glutes'], 'calves': ['calves'], 'adductors': ['quads'], 'abductors': ['glutes'],
    'abdominals': ['abs', 'obliques']
}
MUSCLE_TR = {
    'chest': 'göğüs', 'lats': 'kanat', 'middle back': 'orta sırt', 'lower back': 'bel', 'traps': 'trapez',
    'shoulders': 'omuz', 'neck': 'boyun', 'biceps': 'biceps', 'triceps': 'triceps', 'forearms': 'ön kol',
    'quadriceps': 'ön bacak', 'hamstrings': 'arka bacak', 'glutes': 'kalça', 'calves': 'baldır',
    'adductors': 'iç bacak', 'abductors': 'dış kalça', 'abdominals': 'karın'
}
EQUIP_TR = {
    'barbell': 'Barbell', 'dumbbell': 'Dumbbell', 'cable': 'Kablo', 'machine': 'Makine',
    'body only': 'Vücut ağırlığı', 'kettlebells': 'Kettlebell', 'bands': 'Direnç bandı',
    'medicine ball': 'Sağlık topu', 'exercise ball': 'Pilates topu', 'foam roll': 'Foam roller',
    'e-z curl bar': 'EZ bar', 'other': 'Diğer', None: 'Ekipmansız'
}
LEVEL_TR = {'beginner': 'Başlangıç', 'intermediate': 'Orta', 'expert': 'İleri'}
CAT_TR = {
    'strength': 'kuvvet', 'stretching': 'esneme', 'plyometrics': 'pliometrik', 'powerlifting': 'powerlifting',
    'olympic weightlifting': 'olimpik halter', 'strongman': 'strongman', 'cardio': 'kardiyo'
}


def convert(e):
    cat = e.get('category')
    prim = e.get('primaryMuscles') or []
    sec = e.get('secondaryMuscles') or []
    if cat == 'stretching':
        group = 'Esneme'
    elif cat == 'cardio':
        group = 'Kardiyo'
    else:
        group = GROUP_BY_MUSCLE.get(prim[0] if prim else '', 'Karın')
    region = 'upper' if group in ('Göğüs', 'Sırt', 'Omuz', 'Kol') else 'lower' if group in ('Bacak', 'Karın') else 'other'
    muscles = []
    for m in prim + sec:
        for k in MUSCLE_KEYS.get(m, []):
            if k not in muscles:
                muscles.append(k)
    mech = e.get('mechanic')
    if cat == 'stretching':
        sets, reps, rest = 2, '30 sn', 30
    elif cat == 'cardio':
        sets, reps, rest = 1, '10 dk', 60
    elif cat == 'plyometrics':
        sets, reps, rest = 3, '8-10', 90
    elif mech == 'compound':
        sets, reps, rest = 3, '8-12', 90
    else:
        sets, reps, rest = 3, '10-15', 60
    kind = 'bileşik' if mech == 'compound' else 'izolasyon' if mech == 'isolation' else ''
    desc = f"{', '.join(MUSCLE_TR.get(m, m) for m in prim).capitalize() or group} bölgesini hedefleyen {kind + ' ' if kind else ''}{CAT_TR.get(cat, '')} egzersizi."
    if sec:
        desc += f" Yardımcı kaslar: {', '.join(MUSCLE_TR.get(m, m) for m in sec)}."
    return {
        'id': e['id'], 'name': e['name'], 'group': group, 'region': region, 'muscles': muscles,
        'equipment': EQUIP_TR.get(e.get('equipment'), 'Diğer'), 'level': LEVEL_TR.get(e.get('level'), 'Orta'),
        'sets': sets, 'reps': reps, 'rest': rest, 'desc': desc, 'steps': e.get('instructions') or [],
        'cat': CAT_TR.get(cat, ''), 'bw': e.get('equipment') in ('body only', None)
    }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    data = json.load(open(os.path.join(src, 'dist', 'exercises.json'), encoding='utf-8'))
    out, skipped = [], 0
    thumbs = '--thumbs' in sys.argv
    th_dir = os.path.join(ROOT, 'assets', 'img', 'th')
    for e in data:
        if e['id'] in CORE:
            continue
        img = os.path.join(src, 'exercises', e['id'], '0.jpg')
        th = os.path.join(th_dir, e['id'] + '.jpg')
        if thumbs:
            if not os.path.exists(img):
                skipped += 1
                continue
            from PIL import Image
            os.makedirs(th_dir, exist_ok=True)
            im = Image.open(img).convert('RGB')
            w, h = im.size
            s = min(w, h)
            im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((200, 200), Image.LANCZOS)
            im.save(th, 'JPEG', quality=62, optimize=True, progressive=True)
        elif not os.path.exists(th):
            skipped += 1
            continue
        out.append(convert(e))
    out.sort(key=lambda x: x['name'].lower())
    js = ('/* Otomatik üretildi: tools/build-exercise-db.py — elle düzenleme */\n'
          '/* Kaynak: Free Exercise DB (kamu malı, Unlicense) */\n'
          "'use strict';\nconst EXTRA_EXERCISES = " + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(ROOT, 'js', 'exercises-db.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    print(f'{len(out)} egzersiz yazıldı, {skipped} atlandı (görsel yok).')


if __name__ == '__main__':
    main()
