import express, { Router } from 'express';

export class ApiRouter {
  public router: Router;

  constructor() {
    this.router = express.Router()
    this.router.get('/', (_, res: any) => res.json('Hello World!'))
  }
}
