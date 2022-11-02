import { beforeEach, describe, expect, it } from 'vitest'
import type { SuperTest, Test } from 'supertest'
import supertest from 'supertest'
import type { App } from 'h3'
import { createApp, eventHandler, toNodeListener } from 'h3'
import { withValidatedApiRoute, z } from '../src'

describe('withValidatedApiRoute', () => {
  let app: App
  let request: SuperTest<Test>

  beforeEach(() => {
    app = createApp({ debug: false })
    request = supertest(toNodeListener(app))
  })

  const querySchema = z.object({
    required: z.string().transform(Boolean),
  })

  const bodySchema = z.object({
    optional: z.string().optional(),
    required: z.boolean(),
  })

  it('returns 200 OK if query/body matches validation schema', async () => {
    app.use('/validate', withValidatedApiRoute(
      eventHandler(() => {
        return { ok: true }
      }),
      {
        body: bodySchema,
        query: querySchema,
      },
    ))

    const res = await request.post('/validate?required=true').send({
      required: true,
    })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchSnapshot()
  })

  it('throws 400 Bad Request if querybody does not match validation schema', async () => {
    app.use('/validate', withValidatedApiRoute(
      eventHandler(() => {
        return { ok: true }
      }),
      {
        body: bodySchema,
        query: querySchema,
      },
    ))

    const res = await request.post('/validate?required=true')

    expect(res.status).toEqual(400)
    expect(res.body).toMatchSnapshot()
  })

  it('passes parsed data to `event.context`', async () => {
    app.use('/validate', withValidatedApiRoute(
      eventHandler((event) => {
        return event.context.parsedData
      }),
      {
        body: bodySchema,
        query: querySchema,
      },
    ))

    const res = await request.post('/validate?required=true').send({
      required: true,
    })

    expect(res.body.query.required === true)
    expect(res.body.body.required === true)
  })
})