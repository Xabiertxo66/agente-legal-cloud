import { expect, test } from 'claude-code/testing'
import { analizar } from './analizar.ts'

test('detecta cita sin ECLI y la admite con ECLI', async () => {
  const sin = analizar('Como declara la STS 123/2020, de 4 de marzo, procede.')
  expect(sin.filter(h => h.tipo === 'jurisprudencia').length).toBe(1)
  const con = analizar('Como declara la STS 123/2020 (ECLI:ES:TS:2020:111), procede.')
  expect(con.filter(h => h.tipo === 'jurisprudencia').length).toBe(0)
})

test('norma: solo la primera mención exige marcador', async () => {
  const ok = analizar('La Ley 39/2015 [VERIFICAR VIGENCIA] regula. La Ley 39/2015 también.')
  expect(ok.filter(h => h.tipo === 'norma').length).toBe(0)
  const mal = analizar('El Real Decreto Legislativo 2/2015 regula.')
  expect(mal.filter(h => h.tipo === 'norma').length).toBe(1)
})

test('tipografía', async () => {
  const hs = analizar('Texto — inciso y “comillas” y otro - inciso.')
  expect(hs.filter(h => h.tipo === 'tipografia').length).toBe(4)
})
