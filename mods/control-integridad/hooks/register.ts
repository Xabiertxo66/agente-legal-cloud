import type { Register } from 'claude-code'
import { analizar, informe } from './analizar.ts'

const ESCRITO = /\.(md|txt)$/i

const resumen = (n: number) => (n === 0 ? undefined : `integridad: ${n} aviso(s)`)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'integridad', description: 'Revisa un escrito (.md o .txt): citas sin ECLI, normas sin [VERIFICAR VIGENCIA], tipografía' })
    return next(e)
  })

  on('command.run', { command: 'integridad' }, async ($, e) => {
    const ruta = e.args.trim()
    if (ruta === '') return { text: 'Uso: /integridad <ruta del escrito>' }
    const texto = await $.fs.read(ruta).catch(() => undefined)
    if (texto === undefined) return { text: `No se puede leer ${ruta}.` }
    const hs = analizar(texto)
    $.ui.status(resumen(hs.length))
    return { text: hs.length === 0 ? `Sin avisos de integridad en ${ruta}.` : informe(ruta, hs) }
  })

  for (const tool of ['Write', 'Edit'] as const) {
    on('tool.call', { tool }, async ($, e, next) => {
      const ran = await next(e)
      if (!ESCRITO.test(e.file_path) || ran.deny !== undefined || ran.isError) return ran
      const texto = await $.fs.read(e.file_path).catch(() => undefined)
      if (texto === undefined) return ran
      const hs = analizar(texto)
      $.ui.status(resumen(hs.length))
      if (hs.length === 0) return ran
      const aviso = `${informe(e.file_path, hs)}\nAplica la regla de integridad: corrige o marca cada punto antes de entregar, o explica por qué no procede.`
      return { ...ran, context: [...(ran.context ?? []), aviso] }
    }).catch((_, e, next) => next(e))
  }
}
