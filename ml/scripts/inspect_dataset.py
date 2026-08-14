from pathlib import Path
import pandas as pd

root = Path(r'C:\Users\xfive\Desktop\Project MAREA\ml\data\raw\Data_modele_to_Bassiana\Data_modele_to_Bassiana')
for p in sorted(root.iterdir()):
    if p.suffix.lower() not in {'.xls', '.xlsx'}:
        continue
    print(f'\nFILE: {p.name}')
    try:
        xl = pd.ExcelFile(p)
        print('SHEETS:', xl.sheet_names)
        for s in xl.sheet_names[:3]:
            df = pd.read_excel(p, sheet_name=s, nrows=10)
            print(f'--- {s} shape={df.shape}')
            print(df.head(10).to_string(index=False))
    except Exception as e:
        print('ERROR:', type(e).__name__, e)
