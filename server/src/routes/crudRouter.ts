import { Router } from 'express'

interface CrudService<T> {
  list: () => Promise<T[]>
  get: (id: string) => Promise<T | null>
  create: (dto: T) => Promise<T>
  update: (id: string, dto: T) => Promise<T>
  remove: (id: string) => Promise<void>
}

/** Monta um Router REST padrão (GET / , GET /:id, POST / , PUT /:id, DELETE /:id)
 *  a partir de um service CRUD. Erros são repassados ao handler global. */
export function crudRouter<T>(service: CrudService<T>): Router {
  const router = Router()

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await service.list())
    } catch (e) {
      next(e)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await service.get(req.params.id)
      if (!item) return res.status(404).json({ error: 'Não encontrado.' })
      res.json(item)
    } catch (e) {
      next(e)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await service.create(req.body as T))
    } catch (e) {
      next(e)
    }
  })

  router.put('/:id', async (req, res, next) => {
    try {
      res.json(await service.update(req.params.id, req.body as T))
    } catch (e) {
      next(e)
    }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      await service.remove(req.params.id)
      res.status(204).end()
    } catch (e) {
      next(e)
    }
  })

  return router
}
