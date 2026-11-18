# control-integridad

Mod de Claude Code que, tras cada Write o Edit sobre un archivo .md o .txt, relee el escrito completo y comunica al modelo (y en la barra de estado) los incumplimientos de la regla de integridad:

1. Citas jurisprudenciales (STS, STSJ, STC, SAN, SAP, ATS, STJUE, "Sentencia del Tribunal...", "rec. 123/2020") sin ECLI en el mismo párrafo. Se excluyen las marcadas con [INSERTAR FALLO VERIFICADO.
2. Primera mención de una norma con número y año (Ley, Ley Orgánica, Real Decreto, Real Decreto-ley, Real Decreto Legislativo, Decreto, Decreto Foral, Norma Foral, Directiva, Reglamento (UE)) sin [VERIFICAR VIGENCIA] o [REVISIÓN NORMATIVA REQUERIDA].
3. Tipografía: guion largo o medio, comillas curvas o angulares, guion corto como inciso.

No bloquea la edición: avisa. Comando manual: `/integridad <ruta>`.

## Instalación

```
/plugin install control-integridad --marketplace Xabiertxo66/agente-legal-cloud
```

## Límites

No revisa .docx ni texto que no se guarde en archivo. No detecta normas citadas solo por abreviatura (LRJCA, ET) sin número y año. No sabe si una cita procede de material aportado: el aviso obliga a confirmarlo.
