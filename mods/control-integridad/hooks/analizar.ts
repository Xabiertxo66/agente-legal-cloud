// Análisis puro del texto de un escrito. Sin dependencias del motor.

export type Hallazgo = { tipo: 'jurisprudencia' | 'norma' | 'tipografia'; linea: number; extracto: string; motivo: string }

const JURIS = new RegExp(
  [
    String.raw`\b(?:SS?TS|SS?TSJ|SS?TC|SS?AN|SS?AP|AA?TS|AA?TC|SS?TJUE|SJCA|SJS)\b[^\n.;]{0,90}?(?:\d{1,5}\/\d{4}|\d{1,2} de [a-záéíóú]+ de \d{4})`,
    String.raw`\b[Ss]entencias? (?:del?|de la) (?:Tribunal|Sala|Audiencia|Juzgado)[^\n.;]{0,120}?(?:\d{1,5}\/\d{4}|\d{1,2} de [a-záéíóú]+ de \d{4})`,
    String.raw`\b(?:rec(?:urso)?\.?|RCUD|RCA|PO|PA)\s*(?:n[º°o.]\s*)?\d{1,5}\/\d{4}`,
  ].join('|'),
  'g',
)

const NORMA = /\b(Ley Orgánica|Ley|Real Decreto-ley|Real Decreto Legislativo|Real Decreto|Decreto Legislativo|Decreto Foral Normativo|Decreto Foral|Norma Foral|Decreto|Directiva|Reglamento \((?:UE|CE)\))\s+(?:n\.?[º°]\s*)?(\d{1,4}\/\d{4}(?:\/[A-Z]{2,3})?)/g

const MARCA_VIGENCIA = /\[(?:VERIFICAR VIGENCIA|REVISIÓN NORMATIVA REQUERIDA)/

const TIPO: Array<[RegExp, string]> = [
  [/[—–]/g, 'guion largo o medio: usar paréntesis'],
  [/[“”‘’«»]/g, 'comillas no rectas'],
  [/\S \- \S/g, 'guion corto como inciso: usar paréntesis'],
]

const lineaDe = (texto: string, idx: number) => texto.slice(0, idx).split('\n').length

const parrafo = (texto: string, idx: number) => {
  const ini = texto.lastIndexOf('\n\n', idx)
  const fin = texto.indexOf('\n\n', idx)
  return texto.slice(ini < 0 ? 0 : ini, fin < 0 ? texto.length : fin)
}

export const analizar = (texto: string): Hallazgo[] => {
  const out: Hallazgo[] = []

  for (const m of texto.matchAll(JURIS)) {
    const p = parrafo(texto, m.index!)
    if (/ECLI:[A-Z]{2}:/.test(p) || /\[INSERTAR FALLO VERIFICADO/.test(p)) continue
    out.push({ tipo: 'jurisprudencia', linea: lineaDe(texto, m.index!), extracto: m[0].trim(), motivo: 'cita sin ECLI en el párrafo: confirmar que procede de material aportado o de CENDOJ' })
  }

  const vistas = new Set<string>()
  for (const m of texto.matchAll(NORMA)) {
    const clave = `${m[1]} ${m[2]}`.toLowerCase()
    if (vistas.has(clave)) continue
    vistas.add(clave)
    const tras = texto.slice(m.index! + m[0].length, m.index! + m[0].length + 300)
    if (MARCA_VIGENCIA.test(tras)) continue
    out.push({ tipo: 'norma', linea: lineaDe(texto, m.index!), extracto: m[0], motivo: 'primera mención sin [VERIFICAR VIGENCIA]' })
  }

  for (const [re, motivo] of TIPO) {
    for (const m of texto.matchAll(re)) {
      out.push({ tipo: 'tipografia', linea: lineaDe(texto, m.index!), extracto: texto.slice(Math.max(0, m.index! - 15), m.index! + 15).replace(/\n/g, ' '), motivo })
    }
  }

  return out.sort((a, b) => a.linea - b.linea)
}

export const informe = (ruta: string, hs: Hallazgo[]) => {
  const n = (t: Hallazgo['tipo']) => hs.filter(h => h.tipo === t).length
  const cab = `Control de integridad sobre ${ruta}: ${n('jurisprudencia')} cita(s) jurisprudencial(es) sin ECLI, ${n('norma')} norma(s) sin [VERIFICAR VIGENCIA], ${n('tipografia')} incidencia(s) tipográfica(s).`
  const filas = hs.slice(0, 40).map(h => `- L${h.linea} [${h.tipo}] "${h.extracto}": ${h.motivo}`)
  const resto = hs.length > 40 ? [`(y ${hs.length - 40} más)`] : []
  return [cab, ...filas, ...resto].join('\n')
}
