import ormConfig from '@/database/orm.config';
import {
  Entity,
  Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseRepository } from './base.repository';

describe('BaseRepository', () => {
  let mod: TestingModule;
  let simplePkRepository: SimplePkEntityRepository;
  let compositePkRepository: CompositePkEntityRepository;
  let entityManager: EntityManager;
  let orm: MikroORM;
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [],
      providers: [SimplePkEntityRepository, CompositePkEntityRepository],
      imports: [
        MikroOrmModule.forRoot({
          ...ormConfig,
          entitiesTs: undefined,
          entities: [SimplePkEntity, CompositePkEntity],
        }),
      ],
    }).compile();

    orm = mod.get(MikroORM);
    simplePkRepository = mod.get(SimplePkEntityRepository);
    compositePkRepository = mod.get(CompositePkEntityRepository);
    entityManager = mod.get(EntityManager);

    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await mod.close();
  });

  describe('findOneByPk', () => {
    it('should properly return entity with simple pk', async () => {
      const em = entityManager.fork();
      const name = `some random name${Date.now()}`;
      const pk = await em.insert(SimplePkEntity, {
        name,
      });

      const instance = await simplePkRepository.findOneByPk(pk);
      expect(instance).not.toBeNull();
      expect(instance!.name).toBe(name);
    });

    it('should properly return entity with composite pk', async () => {
      const em = entityManager.fork();
      const name = `some random name${Date.now()}`;

      await em.insert(CompositePkEntity, {
        name,
        pk1: 1,
        pk2: 1,
      });

      // Apparently MikroORM does not returning the primary key when using composite primary keys. We need to supply it manually
      const instance = await compositePkRepository.findOneByPk([1, 1]);
      expect(instance).not.toBeNull();
      expect(instance!.name).toBe(name);
    });
  });
});

@Entity()
class CompositePkEntity {
  @PrimaryKey()
  pk1: number;

  @PrimaryKey()
  pk2: number;

  [PrimaryKeyProp]?: ['pk1', 'pk2'];

  @Property()
  name: string;
}

class CompositePkEntityRepository extends BaseRepository<CompositePkEntity> {
  constructor(@Inject(EntityManager) entityManager: EntityManager) {
    super(entityManager, CompositePkEntity);
  }
}

@Entity()
class SimplePkEntity {
  @PrimaryKey({ autoincrement: true })
  pk: number & Opt;

  [PrimaryKeyProp]?: ['pk'];

  @Property()
  name: string;
}

class SimplePkEntityRepository extends BaseRepository<SimplePkEntity> {
  constructor(@Inject(EntityManager) entityManager: EntityManager) {
    super(entityManager, SimplePkEntity);
  }
}
