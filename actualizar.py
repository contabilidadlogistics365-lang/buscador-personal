import pandas as pd
import json
import subprocess
import os
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_FILE = os.path.join(BASE_DIR, 'empleados.xlsx')
DATOS_JS_FILE = os.path.join(BASE_DIR, 'datos.js')

try:
    print("🔄 Leyendo archivo Excel...")
    
    if not os.path.exists(EXCEL_FILE):
        raise FileNotFoundError(f"No se encontró 'empleados.xlsx' en la carpeta del proyecto.")

    # Leer el Excel
    df = pd.read_excel(EXCEL_FILE)
    
    # Limpiar nombres de columnas (eliminar espacios adicionales y convertir a mayúsculas para comparar)
    df.columns = [str(c).strip().upper() for c in df.columns]
    
    # Identificar nombres de columnas automáticamente
    col_tipo = next((c for c in df.columns if 'TIPO' in c or 'DOC' in c and 'NUM' not in c), None)
    col_doc = next((c for c in df.columns if 'DOCUMENTO' in c or 'CEDULA' in c or 'ID' in c or 'NUMERO' in c), None)
    col_nombre = next((c for c in df.columns if 'NOMBRE' in c or 'EMPLEADO' in c or 'WORKER' in c), None)

    # Si no los encuentra por palabra clave, toma las 3 primeras columnas por posición
    if not col_nombre and len(df.columns) >= 3:
        col_tipo, col_doc, col_nombre = df.columns[0], df.columns[1], df.columns[2]

    df = df.fillna('')
    trabajadores = []

    for _, row in df.iterrows():
        tipo_doc = str(row.get(col_tipo, '')).strip() if col_tipo else ''
        doc = str(row.get(col_doc, '')).strip() if col_doc else ''
        nombre = str(row.get(col_nombre, '')).strip() if col_nombre else ''

        # Formatear números de documento que vengan como flotantes de Excel
        if doc.endswith('.0'):
            doc = doc[:-2]

        if nombre or doc:
            trabajadores.append({
                "tipoDoc": tipo_doc if tipo_doc else "CC",
                "documento": doc,
                "nombre": nombre
            })

    # Guardar en datos.js
    contenido = f"// Actualizado automáticamente el {datetime.now().strftime('%Y-%m-%d %H:%M')}\nconst trabajadores = {json.dumps(trabajadores, ensure_ascii=False, indent=2)};\n"

    with open(DATOS_JS_FILE, 'w', encoding='utf-8') as f:
        f.write(contenido)

    print(f"✅ datos.js actualizado con {len(trabajadores)} empleados.")

    # Subir a GitHub usando shell=True para compatibilidad con Windows
    print("🚀 Subiendo a GitHub...")
    subprocess.run("git add datos.js", shell=True, check=True, cwd=BASE_DIR)
    subprocess.run('git commit -m "Actualización automática de personal"', shell=True, check=True, cwd=BASE_DIR)
    subprocess.run("git push", shell=True, check=True, cwd=BASE_DIR)

    print("🎉 ¡Sincronización completa! Revisa tu página en 1 minuto.")

except Exception as e:
    print(f"❌ Error: {e}")

subprocess.run("git push -u origin main", shell=True, check=True, cwd=BASE_DIR)