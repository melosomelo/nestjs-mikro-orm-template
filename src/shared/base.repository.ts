import {
  EntityManager,
  EntityName,
  FilterQuery,
  MikroORM,
  Primary,
} from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';

export abstract class BaseRepository<T extends object> {
  constructor(
    private entityManager: EntityManager,
    private entityName: EntityName<T>,
  ) {
    this.em = this.entityManager.fork();
  }

  @Inject(MikroORM) private orm: MikroORM;

  private em: EntityManager;

  findOneByPk(pk: Primary<T>) {
    return this.em.findOne<T>(this.entityName, pk as FilterQuery<T>);
  }
}
