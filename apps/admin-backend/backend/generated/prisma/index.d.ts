
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Zone
 * 
 */
export type Zone = $Result.DefaultSelection<Prisma.$ZonePayload>
/**
 * Model CallbackRequest
 * 
 */
export type CallbackRequest = $Result.DefaultSelection<Prisma.$CallbackRequestPayload>
/**
 * Model FieldManager
 * 
 */
export type FieldManager = $Result.DefaultSelection<Prisma.$FieldManagerPayload>
/**
 * Model Team
 * 
 */
export type Team = $Result.DefaultSelection<Prisma.$TeamPayload>
/**
 * Model CareCompanion
 * 
 */
export type CareCompanion = $Result.DefaultSelection<Prisma.$CareCompanionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  subscriber: 'subscriber',
  beneficiary: 'beneficiary',
  care_companion: 'care_companion',
  field_manager: 'field_manager',
  operations_manager: 'operations_manager',
  emergency_coordinator: 'emergency_coordinator',
  volunteer: 'volunteer'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const CallbackStatus: {
  pending: 'pending',
  called: 'called',
  resolved: 'resolved'
};

export type CallbackStatus = (typeof CallbackStatus)[keyof typeof CallbackStatus]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type CallbackStatus = $Enums.CallbackStatus

export const CallbackStatus: typeof $Enums.CallbackStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.zone`: Exposes CRUD operations for the **Zone** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Zones
    * const zones = await prisma.zone.findMany()
    * ```
    */
  get zone(): Prisma.ZoneDelegate<ExtArgs>;

  /**
   * `prisma.callbackRequest`: Exposes CRUD operations for the **CallbackRequest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CallbackRequests
    * const callbackRequests = await prisma.callbackRequest.findMany()
    * ```
    */
  get callbackRequest(): Prisma.CallbackRequestDelegate<ExtArgs>;

  /**
   * `prisma.fieldManager`: Exposes CRUD operations for the **FieldManager** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FieldManagers
    * const fieldManagers = await prisma.fieldManager.findMany()
    * ```
    */
  get fieldManager(): Prisma.FieldManagerDelegate<ExtArgs>;

  /**
   * `prisma.team`: Exposes CRUD operations for the **Team** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Teams
    * const teams = await prisma.team.findMany()
    * ```
    */
  get team(): Prisma.TeamDelegate<ExtArgs>;

  /**
   * `prisma.careCompanion`: Exposes CRUD operations for the **CareCompanion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CareCompanions
    * const careCompanions = await prisma.careCompanion.findMany()
    * ```
    */
  get careCompanion(): Prisma.CareCompanionDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Zone: 'Zone',
    CallbackRequest: 'CallbackRequest',
    FieldManager: 'FieldManager',
    Team: 'Team',
    CareCompanion: 'CareCompanion'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "zone" | "callbackRequest" | "fieldManager" | "team" | "careCompanion"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Zone: {
        payload: Prisma.$ZonePayload<ExtArgs>
        fields: Prisma.ZoneFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ZoneFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ZoneFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>
          }
          findFirst: {
            args: Prisma.ZoneFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ZoneFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>
          }
          findMany: {
            args: Prisma.ZoneFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>[]
          }
          create: {
            args: Prisma.ZoneCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>
          }
          createMany: {
            args: Prisma.ZoneCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ZoneCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>[]
          }
          delete: {
            args: Prisma.ZoneDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>
          }
          update: {
            args: Prisma.ZoneUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>
          }
          deleteMany: {
            args: Prisma.ZoneDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ZoneUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ZoneUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ZonePayload>
          }
          aggregate: {
            args: Prisma.ZoneAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateZone>
          }
          groupBy: {
            args: Prisma.ZoneGroupByArgs<ExtArgs>
            result: $Utils.Optional<ZoneGroupByOutputType>[]
          }
          count: {
            args: Prisma.ZoneCountArgs<ExtArgs>
            result: $Utils.Optional<ZoneCountAggregateOutputType> | number
          }
        }
      }
      CallbackRequest: {
        payload: Prisma.$CallbackRequestPayload<ExtArgs>
        fields: Prisma.CallbackRequestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CallbackRequestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CallbackRequestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>
          }
          findFirst: {
            args: Prisma.CallbackRequestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CallbackRequestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>
          }
          findMany: {
            args: Prisma.CallbackRequestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>[]
          }
          create: {
            args: Prisma.CallbackRequestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>
          }
          createMany: {
            args: Prisma.CallbackRequestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CallbackRequestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>[]
          }
          delete: {
            args: Prisma.CallbackRequestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>
          }
          update: {
            args: Prisma.CallbackRequestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>
          }
          deleteMany: {
            args: Prisma.CallbackRequestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CallbackRequestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CallbackRequestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CallbackRequestPayload>
          }
          aggregate: {
            args: Prisma.CallbackRequestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCallbackRequest>
          }
          groupBy: {
            args: Prisma.CallbackRequestGroupByArgs<ExtArgs>
            result: $Utils.Optional<CallbackRequestGroupByOutputType>[]
          }
          count: {
            args: Prisma.CallbackRequestCountArgs<ExtArgs>
            result: $Utils.Optional<CallbackRequestCountAggregateOutputType> | number
          }
        }
      }
      FieldManager: {
        payload: Prisma.$FieldManagerPayload<ExtArgs>
        fields: Prisma.FieldManagerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FieldManagerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FieldManagerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>
          }
          findFirst: {
            args: Prisma.FieldManagerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FieldManagerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>
          }
          findMany: {
            args: Prisma.FieldManagerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>[]
          }
          create: {
            args: Prisma.FieldManagerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>
          }
          createMany: {
            args: Prisma.FieldManagerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FieldManagerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>[]
          }
          delete: {
            args: Prisma.FieldManagerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>
          }
          update: {
            args: Prisma.FieldManagerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>
          }
          deleteMany: {
            args: Prisma.FieldManagerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FieldManagerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FieldManagerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FieldManagerPayload>
          }
          aggregate: {
            args: Prisma.FieldManagerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFieldManager>
          }
          groupBy: {
            args: Prisma.FieldManagerGroupByArgs<ExtArgs>
            result: $Utils.Optional<FieldManagerGroupByOutputType>[]
          }
          count: {
            args: Prisma.FieldManagerCountArgs<ExtArgs>
            result: $Utils.Optional<FieldManagerCountAggregateOutputType> | number
          }
        }
      }
      Team: {
        payload: Prisma.$TeamPayload<ExtArgs>
        fields: Prisma.TeamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          findFirst: {
            args: Prisma.TeamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          findMany: {
            args: Prisma.TeamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          create: {
            args: Prisma.TeamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          createMany: {
            args: Prisma.TeamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          delete: {
            args: Prisma.TeamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          update: {
            args: Prisma.TeamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          deleteMany: {
            args: Prisma.TeamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TeamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          aggregate: {
            args: Prisma.TeamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeam>
          }
          groupBy: {
            args: Prisma.TeamGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeamGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeamCountArgs<ExtArgs>
            result: $Utils.Optional<TeamCountAggregateOutputType> | number
          }
        }
      }
      CareCompanion: {
        payload: Prisma.$CareCompanionPayload<ExtArgs>
        fields: Prisma.CareCompanionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CareCompanionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CareCompanionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>
          }
          findFirst: {
            args: Prisma.CareCompanionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CareCompanionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>
          }
          findMany: {
            args: Prisma.CareCompanionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>[]
          }
          create: {
            args: Prisma.CareCompanionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>
          }
          createMany: {
            args: Prisma.CareCompanionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CareCompanionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>[]
          }
          delete: {
            args: Prisma.CareCompanionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>
          }
          update: {
            args: Prisma.CareCompanionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>
          }
          deleteMany: {
            args: Prisma.CareCompanionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CareCompanionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CareCompanionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareCompanionPayload>
          }
          aggregate: {
            args: Prisma.CareCompanionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCareCompanion>
          }
          groupBy: {
            args: Prisma.CareCompanionGroupByArgs<ExtArgs>
            result: $Utils.Optional<CareCompanionGroupByOutputType>[]
          }
          count: {
            args: Prisma.CareCompanionCountArgs<ExtArgs>
            result: $Utils.Optional<CareCompanionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type FieldManagerCountOutputType
   */

  export type FieldManagerCountOutputType = {
    teams: number
  }

  export type FieldManagerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    teams?: boolean | FieldManagerCountOutputTypeCountTeamsArgs
  }

  // Custom InputTypes
  /**
   * FieldManagerCountOutputType without action
   */
  export type FieldManagerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManagerCountOutputType
     */
    select?: FieldManagerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FieldManagerCountOutputType without action
   */
  export type FieldManagerCountOutputTypeCountTeamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
  }


  /**
   * Count Type TeamCountOutputType
   */

  export type TeamCountOutputType = {
    careCompanions: number
  }

  export type TeamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    careCompanions?: boolean | TeamCountOutputTypeCountCareCompanionsArgs
  }

  // Custom InputTypes
  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamCountOutputType
     */
    select?: TeamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeCountCareCompanionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CareCompanionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    phone: string | null
    role: $Enums.UserRole | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    phone: string | null
    role: $Enums.UserRole | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    phone: number
    role: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    role?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    role?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    role?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string | null
    phone: string
    role: $Enums.UserRole
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    role?: boolean
    fieldManagerProfile?: boolean | User$fieldManagerProfileArgs<ExtArgs>
    careCompanionProfile?: boolean | User$careCompanionProfileArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    role?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    phone?: boolean
    role?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fieldManagerProfile?: boolean | User$fieldManagerProfileArgs<ExtArgs>
    careCompanionProfile?: boolean | User$careCompanionProfileArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      fieldManagerProfile: Prisma.$FieldManagerPayload<ExtArgs> | null
      careCompanionProfile: Prisma.$CareCompanionPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string | null
      phone: string
      role: $Enums.UserRole
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    fieldManagerProfile<T extends User$fieldManagerProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$fieldManagerProfileArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    careCompanionProfile<T extends User$careCompanionProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$careCompanionProfileArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly phone: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'UserRole'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.fieldManagerProfile
   */
  export type User$fieldManagerProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    where?: FieldManagerWhereInput
  }

  /**
   * User.careCompanionProfile
   */
  export type User$careCompanionProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    where?: CareCompanionWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Zone
   */

  export type AggregateZone = {
    _count: ZoneCountAggregateOutputType | null
    _avg: ZoneAvgAggregateOutputType | null
    _sum: ZoneSumAggregateOutputType | null
    _min: ZoneMinAggregateOutputType | null
    _max: ZoneMaxAggregateOutputType | null
  }

  export type ZoneAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type ZoneSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type ZoneMinAggregateOutputType = {
    id: string | null
    name: string | null
    city: string | null
    address: string | null
    state: string | null
    pincode: string | null
    latitude: number | null
    longitude: number | null
    phone: string | null
    leaseStartDate: Date | null
    leaseEndDate: Date | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    fieldManagerId: string | null
  }

  export type ZoneMaxAggregateOutputType = {
    id: string | null
    name: string | null
    city: string | null
    address: string | null
    state: string | null
    pincode: string | null
    latitude: number | null
    longitude: number | null
    phone: string | null
    leaseStartDate: Date | null
    leaseEndDate: Date | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    fieldManagerId: string | null
  }

  export type ZoneCountAggregateOutputType = {
    id: number
    name: number
    city: number
    address: number
    state: number
    pincode: number
    latitude: number
    longitude: number
    phone: number
    leaseStartDate: number
    leaseEndDate: number
    isActive: number
    createdAt: number
    updatedAt: number
    fieldManagerId: number
    _all: number
  }


  export type ZoneAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type ZoneSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type ZoneMinAggregateInputType = {
    id?: true
    name?: true
    city?: true
    address?: true
    state?: true
    pincode?: true
    latitude?: true
    longitude?: true
    phone?: true
    leaseStartDate?: true
    leaseEndDate?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    fieldManagerId?: true
  }

  export type ZoneMaxAggregateInputType = {
    id?: true
    name?: true
    city?: true
    address?: true
    state?: true
    pincode?: true
    latitude?: true
    longitude?: true
    phone?: true
    leaseStartDate?: true
    leaseEndDate?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    fieldManagerId?: true
  }

  export type ZoneCountAggregateInputType = {
    id?: true
    name?: true
    city?: true
    address?: true
    state?: true
    pincode?: true
    latitude?: true
    longitude?: true
    phone?: true
    leaseStartDate?: true
    leaseEndDate?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    fieldManagerId?: true
    _all?: true
  }

  export type ZoneAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Zone to aggregate.
     */
    where?: ZoneWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Zones to fetch.
     */
    orderBy?: ZoneOrderByWithRelationInput | ZoneOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ZoneWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Zones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Zones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Zones
    **/
    _count?: true | ZoneCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ZoneAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ZoneSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ZoneMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ZoneMaxAggregateInputType
  }

  export type GetZoneAggregateType<T extends ZoneAggregateArgs> = {
        [P in keyof T & keyof AggregateZone]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateZone[P]>
      : GetScalarType<T[P], AggregateZone[P]>
  }




  export type ZoneGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ZoneWhereInput
    orderBy?: ZoneOrderByWithAggregationInput | ZoneOrderByWithAggregationInput[]
    by: ZoneScalarFieldEnum[] | ZoneScalarFieldEnum
    having?: ZoneScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ZoneCountAggregateInputType | true
    _avg?: ZoneAvgAggregateInputType
    _sum?: ZoneSumAggregateInputType
    _min?: ZoneMinAggregateInputType
    _max?: ZoneMaxAggregateInputType
  }

  export type ZoneGroupByOutputType = {
    id: string
    name: string
    city: string
    address: string
    state: string
    pincode: string
    latitude: number | null
    longitude: number | null
    phone: string | null
    leaseStartDate: Date | null
    leaseEndDate: Date | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    fieldManagerId: string | null
    _count: ZoneCountAggregateOutputType | null
    _avg: ZoneAvgAggregateOutputType | null
    _sum: ZoneSumAggregateOutputType | null
    _min: ZoneMinAggregateOutputType | null
    _max: ZoneMaxAggregateOutputType | null
  }

  type GetZoneGroupByPayload<T extends ZoneGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ZoneGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ZoneGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ZoneGroupByOutputType[P]>
            : GetScalarType<T[P], ZoneGroupByOutputType[P]>
        }
      >
    >


  export type ZoneSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    city?: boolean
    address?: boolean
    state?: boolean
    pincode?: boolean
    latitude?: boolean
    longitude?: boolean
    phone?: boolean
    leaseStartDate?: boolean
    leaseEndDate?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    fieldManagerId?: boolean
  }, ExtArgs["result"]["zone"]>

  export type ZoneSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    city?: boolean
    address?: boolean
    state?: boolean
    pincode?: boolean
    latitude?: boolean
    longitude?: boolean
    phone?: boolean
    leaseStartDate?: boolean
    leaseEndDate?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    fieldManagerId?: boolean
  }, ExtArgs["result"]["zone"]>

  export type ZoneSelectScalar = {
    id?: boolean
    name?: boolean
    city?: boolean
    address?: boolean
    state?: boolean
    pincode?: boolean
    latitude?: boolean
    longitude?: boolean
    phone?: boolean
    leaseStartDate?: boolean
    leaseEndDate?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    fieldManagerId?: boolean
  }


  export type $ZonePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Zone"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      city: string
      address: string
      state: string
      pincode: string
      latitude: number | null
      longitude: number | null
      phone: string | null
      leaseStartDate: Date | null
      leaseEndDate: Date | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      fieldManagerId: string | null
    }, ExtArgs["result"]["zone"]>
    composites: {}
  }

  type ZoneGetPayload<S extends boolean | null | undefined | ZoneDefaultArgs> = $Result.GetResult<Prisma.$ZonePayload, S>

  type ZoneCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ZoneFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ZoneCountAggregateInputType | true
    }

  export interface ZoneDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Zone'], meta: { name: 'Zone' } }
    /**
     * Find zero or one Zone that matches the filter.
     * @param {ZoneFindUniqueArgs} args - Arguments to find a Zone
     * @example
     * // Get one Zone
     * const zone = await prisma.zone.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ZoneFindUniqueArgs>(args: SelectSubset<T, ZoneFindUniqueArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Zone that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ZoneFindUniqueOrThrowArgs} args - Arguments to find a Zone
     * @example
     * // Get one Zone
     * const zone = await prisma.zone.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ZoneFindUniqueOrThrowArgs>(args: SelectSubset<T, ZoneFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Zone that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneFindFirstArgs} args - Arguments to find a Zone
     * @example
     * // Get one Zone
     * const zone = await prisma.zone.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ZoneFindFirstArgs>(args?: SelectSubset<T, ZoneFindFirstArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Zone that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneFindFirstOrThrowArgs} args - Arguments to find a Zone
     * @example
     * // Get one Zone
     * const zone = await prisma.zone.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ZoneFindFirstOrThrowArgs>(args?: SelectSubset<T, ZoneFindFirstOrThrowArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Zones that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Zones
     * const zones = await prisma.zone.findMany()
     * 
     * // Get first 10 Zones
     * const zones = await prisma.zone.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const zoneWithIdOnly = await prisma.zone.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ZoneFindManyArgs>(args?: SelectSubset<T, ZoneFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Zone.
     * @param {ZoneCreateArgs} args - Arguments to create a Zone.
     * @example
     * // Create one Zone
     * const Zone = await prisma.zone.create({
     *   data: {
     *     // ... data to create a Zone
     *   }
     * })
     * 
     */
    create<T extends ZoneCreateArgs>(args: SelectSubset<T, ZoneCreateArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Zones.
     * @param {ZoneCreateManyArgs} args - Arguments to create many Zones.
     * @example
     * // Create many Zones
     * const zone = await prisma.zone.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ZoneCreateManyArgs>(args?: SelectSubset<T, ZoneCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Zones and returns the data saved in the database.
     * @param {ZoneCreateManyAndReturnArgs} args - Arguments to create many Zones.
     * @example
     * // Create many Zones
     * const zone = await prisma.zone.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Zones and only return the `id`
     * const zoneWithIdOnly = await prisma.zone.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ZoneCreateManyAndReturnArgs>(args?: SelectSubset<T, ZoneCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Zone.
     * @param {ZoneDeleteArgs} args - Arguments to delete one Zone.
     * @example
     * // Delete one Zone
     * const Zone = await prisma.zone.delete({
     *   where: {
     *     // ... filter to delete one Zone
     *   }
     * })
     * 
     */
    delete<T extends ZoneDeleteArgs>(args: SelectSubset<T, ZoneDeleteArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Zone.
     * @param {ZoneUpdateArgs} args - Arguments to update one Zone.
     * @example
     * // Update one Zone
     * const zone = await prisma.zone.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ZoneUpdateArgs>(args: SelectSubset<T, ZoneUpdateArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Zones.
     * @param {ZoneDeleteManyArgs} args - Arguments to filter Zones to delete.
     * @example
     * // Delete a few Zones
     * const { count } = await prisma.zone.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ZoneDeleteManyArgs>(args?: SelectSubset<T, ZoneDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Zones.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Zones
     * const zone = await prisma.zone.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ZoneUpdateManyArgs>(args: SelectSubset<T, ZoneUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Zone.
     * @param {ZoneUpsertArgs} args - Arguments to update or create a Zone.
     * @example
     * // Update or create a Zone
     * const zone = await prisma.zone.upsert({
     *   create: {
     *     // ... data to create a Zone
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Zone we want to update
     *   }
     * })
     */
    upsert<T extends ZoneUpsertArgs>(args: SelectSubset<T, ZoneUpsertArgs<ExtArgs>>): Prisma__ZoneClient<$Result.GetResult<Prisma.$ZonePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Zones.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneCountArgs} args - Arguments to filter Zones to count.
     * @example
     * // Count the number of Zones
     * const count = await prisma.zone.count({
     *   where: {
     *     // ... the filter for the Zones we want to count
     *   }
     * })
    **/
    count<T extends ZoneCountArgs>(
      args?: Subset<T, ZoneCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ZoneCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Zone.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ZoneAggregateArgs>(args: Subset<T, ZoneAggregateArgs>): Prisma.PrismaPromise<GetZoneAggregateType<T>>

    /**
     * Group by Zone.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ZoneGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ZoneGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ZoneGroupByArgs['orderBy'] }
        : { orderBy?: ZoneGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ZoneGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetZoneGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Zone model
   */
  readonly fields: ZoneFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Zone.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ZoneClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Zone model
   */ 
  interface ZoneFieldRefs {
    readonly id: FieldRef<"Zone", 'String'>
    readonly name: FieldRef<"Zone", 'String'>
    readonly city: FieldRef<"Zone", 'String'>
    readonly address: FieldRef<"Zone", 'String'>
    readonly state: FieldRef<"Zone", 'String'>
    readonly pincode: FieldRef<"Zone", 'String'>
    readonly latitude: FieldRef<"Zone", 'Float'>
    readonly longitude: FieldRef<"Zone", 'Float'>
    readonly phone: FieldRef<"Zone", 'String'>
    readonly leaseStartDate: FieldRef<"Zone", 'DateTime'>
    readonly leaseEndDate: FieldRef<"Zone", 'DateTime'>
    readonly isActive: FieldRef<"Zone", 'Boolean'>
    readonly createdAt: FieldRef<"Zone", 'DateTime'>
    readonly updatedAt: FieldRef<"Zone", 'DateTime'>
    readonly fieldManagerId: FieldRef<"Zone", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Zone findUnique
   */
  export type ZoneFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * Filter, which Zone to fetch.
     */
    where: ZoneWhereUniqueInput
  }

  /**
   * Zone findUniqueOrThrow
   */
  export type ZoneFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * Filter, which Zone to fetch.
     */
    where: ZoneWhereUniqueInput
  }

  /**
   * Zone findFirst
   */
  export type ZoneFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * Filter, which Zone to fetch.
     */
    where?: ZoneWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Zones to fetch.
     */
    orderBy?: ZoneOrderByWithRelationInput | ZoneOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Zones.
     */
    cursor?: ZoneWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Zones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Zones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Zones.
     */
    distinct?: ZoneScalarFieldEnum | ZoneScalarFieldEnum[]
  }

  /**
   * Zone findFirstOrThrow
   */
  export type ZoneFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * Filter, which Zone to fetch.
     */
    where?: ZoneWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Zones to fetch.
     */
    orderBy?: ZoneOrderByWithRelationInput | ZoneOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Zones.
     */
    cursor?: ZoneWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Zones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Zones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Zones.
     */
    distinct?: ZoneScalarFieldEnum | ZoneScalarFieldEnum[]
  }

  /**
   * Zone findMany
   */
  export type ZoneFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * Filter, which Zones to fetch.
     */
    where?: ZoneWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Zones to fetch.
     */
    orderBy?: ZoneOrderByWithRelationInput | ZoneOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Zones.
     */
    cursor?: ZoneWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Zones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Zones.
     */
    skip?: number
    distinct?: ZoneScalarFieldEnum | ZoneScalarFieldEnum[]
  }

  /**
   * Zone create
   */
  export type ZoneCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * The data needed to create a Zone.
     */
    data: XOR<ZoneCreateInput, ZoneUncheckedCreateInput>
  }

  /**
   * Zone createMany
   */
  export type ZoneCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Zones.
     */
    data: ZoneCreateManyInput | ZoneCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Zone createManyAndReturn
   */
  export type ZoneCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Zones.
     */
    data: ZoneCreateManyInput | ZoneCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Zone update
   */
  export type ZoneUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * The data needed to update a Zone.
     */
    data: XOR<ZoneUpdateInput, ZoneUncheckedUpdateInput>
    /**
     * Choose, which Zone to update.
     */
    where: ZoneWhereUniqueInput
  }

  /**
   * Zone updateMany
   */
  export type ZoneUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Zones.
     */
    data: XOR<ZoneUpdateManyMutationInput, ZoneUncheckedUpdateManyInput>
    /**
     * Filter which Zones to update
     */
    where?: ZoneWhereInput
  }

  /**
   * Zone upsert
   */
  export type ZoneUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * The filter to search for the Zone to update in case it exists.
     */
    where: ZoneWhereUniqueInput
    /**
     * In case the Zone found by the `where` argument doesn't exist, create a new Zone with this data.
     */
    create: XOR<ZoneCreateInput, ZoneUncheckedCreateInput>
    /**
     * In case the Zone was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ZoneUpdateInput, ZoneUncheckedUpdateInput>
  }

  /**
   * Zone delete
   */
  export type ZoneDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
    /**
     * Filter which Zone to delete.
     */
    where: ZoneWhereUniqueInput
  }

  /**
   * Zone deleteMany
   */
  export type ZoneDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Zones to delete
     */
    where?: ZoneWhereInput
  }

  /**
   * Zone without action
   */
  export type ZoneDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Zone
     */
    select?: ZoneSelect<ExtArgs> | null
  }


  /**
   * Model CallbackRequest
   */

  export type AggregateCallbackRequest = {
    _count: CallbackRequestCountAggregateOutputType | null
    _min: CallbackRequestMinAggregateOutputType | null
    _max: CallbackRequestMaxAggregateOutputType | null
  }

  export type CallbackRequestMinAggregateOutputType = {
    id: string | null
    name: string | null
    phone: string | null
    subscriberId: string | null
    beneficiaryId: string | null
    status: $Enums.CallbackStatus | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CallbackRequestMaxAggregateOutputType = {
    id: string | null
    name: string | null
    phone: string | null
    subscriberId: string | null
    beneficiaryId: string | null
    status: $Enums.CallbackStatus | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CallbackRequestCountAggregateOutputType = {
    id: number
    name: number
    phone: number
    subscriberId: number
    beneficiaryId: number
    status: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CallbackRequestMinAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    subscriberId?: true
    beneficiaryId?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CallbackRequestMaxAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    subscriberId?: true
    beneficiaryId?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CallbackRequestCountAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    subscriberId?: true
    beneficiaryId?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CallbackRequestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CallbackRequest to aggregate.
     */
    where?: CallbackRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CallbackRequests to fetch.
     */
    orderBy?: CallbackRequestOrderByWithRelationInput | CallbackRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CallbackRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CallbackRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CallbackRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CallbackRequests
    **/
    _count?: true | CallbackRequestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CallbackRequestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CallbackRequestMaxAggregateInputType
  }

  export type GetCallbackRequestAggregateType<T extends CallbackRequestAggregateArgs> = {
        [P in keyof T & keyof AggregateCallbackRequest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCallbackRequest[P]>
      : GetScalarType<T[P], AggregateCallbackRequest[P]>
  }




  export type CallbackRequestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CallbackRequestWhereInput
    orderBy?: CallbackRequestOrderByWithAggregationInput | CallbackRequestOrderByWithAggregationInput[]
    by: CallbackRequestScalarFieldEnum[] | CallbackRequestScalarFieldEnum
    having?: CallbackRequestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CallbackRequestCountAggregateInputType | true
    _min?: CallbackRequestMinAggregateInputType
    _max?: CallbackRequestMaxAggregateInputType
  }

  export type CallbackRequestGroupByOutputType = {
    id: string
    name: string
    phone: string
    subscriberId: string | null
    beneficiaryId: string | null
    status: $Enums.CallbackStatus
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: CallbackRequestCountAggregateOutputType | null
    _min: CallbackRequestMinAggregateOutputType | null
    _max: CallbackRequestMaxAggregateOutputType | null
  }

  type GetCallbackRequestGroupByPayload<T extends CallbackRequestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CallbackRequestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CallbackRequestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CallbackRequestGroupByOutputType[P]>
            : GetScalarType<T[P], CallbackRequestGroupByOutputType[P]>
        }
      >
    >


  export type CallbackRequestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    subscriberId?: boolean
    beneficiaryId?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["callbackRequest"]>

  export type CallbackRequestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    subscriberId?: boolean
    beneficiaryId?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["callbackRequest"]>

  export type CallbackRequestSelectScalar = {
    id?: boolean
    name?: boolean
    phone?: boolean
    subscriberId?: boolean
    beneficiaryId?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $CallbackRequestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CallbackRequest"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      phone: string
      subscriberId: string | null
      beneficiaryId: string | null
      status: $Enums.CallbackStatus
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["callbackRequest"]>
    composites: {}
  }

  type CallbackRequestGetPayload<S extends boolean | null | undefined | CallbackRequestDefaultArgs> = $Result.GetResult<Prisma.$CallbackRequestPayload, S>

  type CallbackRequestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CallbackRequestFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CallbackRequestCountAggregateInputType | true
    }

  export interface CallbackRequestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CallbackRequest'], meta: { name: 'CallbackRequest' } }
    /**
     * Find zero or one CallbackRequest that matches the filter.
     * @param {CallbackRequestFindUniqueArgs} args - Arguments to find a CallbackRequest
     * @example
     * // Get one CallbackRequest
     * const callbackRequest = await prisma.callbackRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CallbackRequestFindUniqueArgs>(args: SelectSubset<T, CallbackRequestFindUniqueArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CallbackRequest that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CallbackRequestFindUniqueOrThrowArgs} args - Arguments to find a CallbackRequest
     * @example
     * // Get one CallbackRequest
     * const callbackRequest = await prisma.callbackRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CallbackRequestFindUniqueOrThrowArgs>(args: SelectSubset<T, CallbackRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CallbackRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestFindFirstArgs} args - Arguments to find a CallbackRequest
     * @example
     * // Get one CallbackRequest
     * const callbackRequest = await prisma.callbackRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CallbackRequestFindFirstArgs>(args?: SelectSubset<T, CallbackRequestFindFirstArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CallbackRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestFindFirstOrThrowArgs} args - Arguments to find a CallbackRequest
     * @example
     * // Get one CallbackRequest
     * const callbackRequest = await prisma.callbackRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CallbackRequestFindFirstOrThrowArgs>(args?: SelectSubset<T, CallbackRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CallbackRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CallbackRequests
     * const callbackRequests = await prisma.callbackRequest.findMany()
     * 
     * // Get first 10 CallbackRequests
     * const callbackRequests = await prisma.callbackRequest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const callbackRequestWithIdOnly = await prisma.callbackRequest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CallbackRequestFindManyArgs>(args?: SelectSubset<T, CallbackRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CallbackRequest.
     * @param {CallbackRequestCreateArgs} args - Arguments to create a CallbackRequest.
     * @example
     * // Create one CallbackRequest
     * const CallbackRequest = await prisma.callbackRequest.create({
     *   data: {
     *     // ... data to create a CallbackRequest
     *   }
     * })
     * 
     */
    create<T extends CallbackRequestCreateArgs>(args: SelectSubset<T, CallbackRequestCreateArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CallbackRequests.
     * @param {CallbackRequestCreateManyArgs} args - Arguments to create many CallbackRequests.
     * @example
     * // Create many CallbackRequests
     * const callbackRequest = await prisma.callbackRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CallbackRequestCreateManyArgs>(args?: SelectSubset<T, CallbackRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CallbackRequests and returns the data saved in the database.
     * @param {CallbackRequestCreateManyAndReturnArgs} args - Arguments to create many CallbackRequests.
     * @example
     * // Create many CallbackRequests
     * const callbackRequest = await prisma.callbackRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CallbackRequests and only return the `id`
     * const callbackRequestWithIdOnly = await prisma.callbackRequest.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CallbackRequestCreateManyAndReturnArgs>(args?: SelectSubset<T, CallbackRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CallbackRequest.
     * @param {CallbackRequestDeleteArgs} args - Arguments to delete one CallbackRequest.
     * @example
     * // Delete one CallbackRequest
     * const CallbackRequest = await prisma.callbackRequest.delete({
     *   where: {
     *     // ... filter to delete one CallbackRequest
     *   }
     * })
     * 
     */
    delete<T extends CallbackRequestDeleteArgs>(args: SelectSubset<T, CallbackRequestDeleteArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CallbackRequest.
     * @param {CallbackRequestUpdateArgs} args - Arguments to update one CallbackRequest.
     * @example
     * // Update one CallbackRequest
     * const callbackRequest = await prisma.callbackRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CallbackRequestUpdateArgs>(args: SelectSubset<T, CallbackRequestUpdateArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CallbackRequests.
     * @param {CallbackRequestDeleteManyArgs} args - Arguments to filter CallbackRequests to delete.
     * @example
     * // Delete a few CallbackRequests
     * const { count } = await prisma.callbackRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CallbackRequestDeleteManyArgs>(args?: SelectSubset<T, CallbackRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CallbackRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CallbackRequests
     * const callbackRequest = await prisma.callbackRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CallbackRequestUpdateManyArgs>(args: SelectSubset<T, CallbackRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CallbackRequest.
     * @param {CallbackRequestUpsertArgs} args - Arguments to update or create a CallbackRequest.
     * @example
     * // Update or create a CallbackRequest
     * const callbackRequest = await prisma.callbackRequest.upsert({
     *   create: {
     *     // ... data to create a CallbackRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CallbackRequest we want to update
     *   }
     * })
     */
    upsert<T extends CallbackRequestUpsertArgs>(args: SelectSubset<T, CallbackRequestUpsertArgs<ExtArgs>>): Prisma__CallbackRequestClient<$Result.GetResult<Prisma.$CallbackRequestPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CallbackRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestCountArgs} args - Arguments to filter CallbackRequests to count.
     * @example
     * // Count the number of CallbackRequests
     * const count = await prisma.callbackRequest.count({
     *   where: {
     *     // ... the filter for the CallbackRequests we want to count
     *   }
     * })
    **/
    count<T extends CallbackRequestCountArgs>(
      args?: Subset<T, CallbackRequestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CallbackRequestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CallbackRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CallbackRequestAggregateArgs>(args: Subset<T, CallbackRequestAggregateArgs>): Prisma.PrismaPromise<GetCallbackRequestAggregateType<T>>

    /**
     * Group by CallbackRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CallbackRequestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CallbackRequestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CallbackRequestGroupByArgs['orderBy'] }
        : { orderBy?: CallbackRequestGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CallbackRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCallbackRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CallbackRequest model
   */
  readonly fields: CallbackRequestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CallbackRequest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CallbackRequestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CallbackRequest model
   */ 
  interface CallbackRequestFieldRefs {
    readonly id: FieldRef<"CallbackRequest", 'String'>
    readonly name: FieldRef<"CallbackRequest", 'String'>
    readonly phone: FieldRef<"CallbackRequest", 'String'>
    readonly subscriberId: FieldRef<"CallbackRequest", 'String'>
    readonly beneficiaryId: FieldRef<"CallbackRequest", 'String'>
    readonly status: FieldRef<"CallbackRequest", 'CallbackStatus'>
    readonly notes: FieldRef<"CallbackRequest", 'String'>
    readonly createdAt: FieldRef<"CallbackRequest", 'DateTime'>
    readonly updatedAt: FieldRef<"CallbackRequest", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CallbackRequest findUnique
   */
  export type CallbackRequestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * Filter, which CallbackRequest to fetch.
     */
    where: CallbackRequestWhereUniqueInput
  }

  /**
   * CallbackRequest findUniqueOrThrow
   */
  export type CallbackRequestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * Filter, which CallbackRequest to fetch.
     */
    where: CallbackRequestWhereUniqueInput
  }

  /**
   * CallbackRequest findFirst
   */
  export type CallbackRequestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * Filter, which CallbackRequest to fetch.
     */
    where?: CallbackRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CallbackRequests to fetch.
     */
    orderBy?: CallbackRequestOrderByWithRelationInput | CallbackRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CallbackRequests.
     */
    cursor?: CallbackRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CallbackRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CallbackRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CallbackRequests.
     */
    distinct?: CallbackRequestScalarFieldEnum | CallbackRequestScalarFieldEnum[]
  }

  /**
   * CallbackRequest findFirstOrThrow
   */
  export type CallbackRequestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * Filter, which CallbackRequest to fetch.
     */
    where?: CallbackRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CallbackRequests to fetch.
     */
    orderBy?: CallbackRequestOrderByWithRelationInput | CallbackRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CallbackRequests.
     */
    cursor?: CallbackRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CallbackRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CallbackRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CallbackRequests.
     */
    distinct?: CallbackRequestScalarFieldEnum | CallbackRequestScalarFieldEnum[]
  }

  /**
   * CallbackRequest findMany
   */
  export type CallbackRequestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * Filter, which CallbackRequests to fetch.
     */
    where?: CallbackRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CallbackRequests to fetch.
     */
    orderBy?: CallbackRequestOrderByWithRelationInput | CallbackRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CallbackRequests.
     */
    cursor?: CallbackRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CallbackRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CallbackRequests.
     */
    skip?: number
    distinct?: CallbackRequestScalarFieldEnum | CallbackRequestScalarFieldEnum[]
  }

  /**
   * CallbackRequest create
   */
  export type CallbackRequestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * The data needed to create a CallbackRequest.
     */
    data: XOR<CallbackRequestCreateInput, CallbackRequestUncheckedCreateInput>
  }

  /**
   * CallbackRequest createMany
   */
  export type CallbackRequestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CallbackRequests.
     */
    data: CallbackRequestCreateManyInput | CallbackRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CallbackRequest createManyAndReturn
   */
  export type CallbackRequestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CallbackRequests.
     */
    data: CallbackRequestCreateManyInput | CallbackRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CallbackRequest update
   */
  export type CallbackRequestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * The data needed to update a CallbackRequest.
     */
    data: XOR<CallbackRequestUpdateInput, CallbackRequestUncheckedUpdateInput>
    /**
     * Choose, which CallbackRequest to update.
     */
    where: CallbackRequestWhereUniqueInput
  }

  /**
   * CallbackRequest updateMany
   */
  export type CallbackRequestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CallbackRequests.
     */
    data: XOR<CallbackRequestUpdateManyMutationInput, CallbackRequestUncheckedUpdateManyInput>
    /**
     * Filter which CallbackRequests to update
     */
    where?: CallbackRequestWhereInput
  }

  /**
   * CallbackRequest upsert
   */
  export type CallbackRequestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * The filter to search for the CallbackRequest to update in case it exists.
     */
    where: CallbackRequestWhereUniqueInput
    /**
     * In case the CallbackRequest found by the `where` argument doesn't exist, create a new CallbackRequest with this data.
     */
    create: XOR<CallbackRequestCreateInput, CallbackRequestUncheckedCreateInput>
    /**
     * In case the CallbackRequest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CallbackRequestUpdateInput, CallbackRequestUncheckedUpdateInput>
  }

  /**
   * CallbackRequest delete
   */
  export type CallbackRequestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
    /**
     * Filter which CallbackRequest to delete.
     */
    where: CallbackRequestWhereUniqueInput
  }

  /**
   * CallbackRequest deleteMany
   */
  export type CallbackRequestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CallbackRequests to delete
     */
    where?: CallbackRequestWhereInput
  }

  /**
   * CallbackRequest without action
   */
  export type CallbackRequestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CallbackRequest
     */
    select?: CallbackRequestSelect<ExtArgs> | null
  }


  /**
   * Model FieldManager
   */

  export type AggregateFieldManager = {
    _count: FieldManagerCountAggregateOutputType | null
    _min: FieldManagerMinAggregateOutputType | null
    _max: FieldManagerMaxAggregateOutputType | null
  }

  export type FieldManagerMinAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    photo: string | null
    zone: string | null
    isAvailable: boolean | null
    createdAt: Date | null
  }

  export type FieldManagerMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    photo: string | null
    zone: string | null
    isAvailable: boolean | null
    createdAt: Date | null
  }

  export type FieldManagerCountAggregateOutputType = {
    id: number
    userId: number
    name: number
    photo: number
    zone: number
    isAvailable: number
    createdAt: number
    _all: number
  }


  export type FieldManagerMinAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    photo?: true
    zone?: true
    isAvailable?: true
    createdAt?: true
  }

  export type FieldManagerMaxAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    photo?: true
    zone?: true
    isAvailable?: true
    createdAt?: true
  }

  export type FieldManagerCountAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    photo?: true
    zone?: true
    isAvailable?: true
    createdAt?: true
    _all?: true
  }

  export type FieldManagerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FieldManager to aggregate.
     */
    where?: FieldManagerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FieldManagers to fetch.
     */
    orderBy?: FieldManagerOrderByWithRelationInput | FieldManagerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FieldManagerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FieldManagers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FieldManagers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FieldManagers
    **/
    _count?: true | FieldManagerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FieldManagerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FieldManagerMaxAggregateInputType
  }

  export type GetFieldManagerAggregateType<T extends FieldManagerAggregateArgs> = {
        [P in keyof T & keyof AggregateFieldManager]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFieldManager[P]>
      : GetScalarType<T[P], AggregateFieldManager[P]>
  }




  export type FieldManagerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FieldManagerWhereInput
    orderBy?: FieldManagerOrderByWithAggregationInput | FieldManagerOrderByWithAggregationInput[]
    by: FieldManagerScalarFieldEnum[] | FieldManagerScalarFieldEnum
    having?: FieldManagerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FieldManagerCountAggregateInputType | true
    _min?: FieldManagerMinAggregateInputType
    _max?: FieldManagerMaxAggregateInputType
  }

  export type FieldManagerGroupByOutputType = {
    id: string
    userId: string
    name: string
    photo: string | null
    zone: string
    isAvailable: boolean
    createdAt: Date
    _count: FieldManagerCountAggregateOutputType | null
    _min: FieldManagerMinAggregateOutputType | null
    _max: FieldManagerMaxAggregateOutputType | null
  }

  type GetFieldManagerGroupByPayload<T extends FieldManagerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FieldManagerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FieldManagerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FieldManagerGroupByOutputType[P]>
            : GetScalarType<T[P], FieldManagerGroupByOutputType[P]>
        }
      >
    >


  export type FieldManagerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    photo?: boolean
    zone?: boolean
    isAvailable?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    teams?: boolean | FieldManager$teamsArgs<ExtArgs>
    _count?: boolean | FieldManagerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fieldManager"]>

  export type FieldManagerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    photo?: boolean
    zone?: boolean
    isAvailable?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fieldManager"]>

  export type FieldManagerSelectScalar = {
    id?: boolean
    userId?: boolean
    name?: boolean
    photo?: boolean
    zone?: boolean
    isAvailable?: boolean
    createdAt?: boolean
  }

  export type FieldManagerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    teams?: boolean | FieldManager$teamsArgs<ExtArgs>
    _count?: boolean | FieldManagerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FieldManagerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $FieldManagerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FieldManager"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      teams: Prisma.$TeamPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      name: string
      photo: string | null
      zone: string
      isAvailable: boolean
      createdAt: Date
    }, ExtArgs["result"]["fieldManager"]>
    composites: {}
  }

  type FieldManagerGetPayload<S extends boolean | null | undefined | FieldManagerDefaultArgs> = $Result.GetResult<Prisma.$FieldManagerPayload, S>

  type FieldManagerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FieldManagerFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FieldManagerCountAggregateInputType | true
    }

  export interface FieldManagerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FieldManager'], meta: { name: 'FieldManager' } }
    /**
     * Find zero or one FieldManager that matches the filter.
     * @param {FieldManagerFindUniqueArgs} args - Arguments to find a FieldManager
     * @example
     * // Get one FieldManager
     * const fieldManager = await prisma.fieldManager.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FieldManagerFindUniqueArgs>(args: SelectSubset<T, FieldManagerFindUniqueArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one FieldManager that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FieldManagerFindUniqueOrThrowArgs} args - Arguments to find a FieldManager
     * @example
     * // Get one FieldManager
     * const fieldManager = await prisma.fieldManager.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FieldManagerFindUniqueOrThrowArgs>(args: SelectSubset<T, FieldManagerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first FieldManager that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerFindFirstArgs} args - Arguments to find a FieldManager
     * @example
     * // Get one FieldManager
     * const fieldManager = await prisma.fieldManager.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FieldManagerFindFirstArgs>(args?: SelectSubset<T, FieldManagerFindFirstArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first FieldManager that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerFindFirstOrThrowArgs} args - Arguments to find a FieldManager
     * @example
     * // Get one FieldManager
     * const fieldManager = await prisma.fieldManager.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FieldManagerFindFirstOrThrowArgs>(args?: SelectSubset<T, FieldManagerFindFirstOrThrowArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more FieldManagers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FieldManagers
     * const fieldManagers = await prisma.fieldManager.findMany()
     * 
     * // Get first 10 FieldManagers
     * const fieldManagers = await prisma.fieldManager.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fieldManagerWithIdOnly = await prisma.fieldManager.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FieldManagerFindManyArgs>(args?: SelectSubset<T, FieldManagerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a FieldManager.
     * @param {FieldManagerCreateArgs} args - Arguments to create a FieldManager.
     * @example
     * // Create one FieldManager
     * const FieldManager = await prisma.fieldManager.create({
     *   data: {
     *     // ... data to create a FieldManager
     *   }
     * })
     * 
     */
    create<T extends FieldManagerCreateArgs>(args: SelectSubset<T, FieldManagerCreateArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many FieldManagers.
     * @param {FieldManagerCreateManyArgs} args - Arguments to create many FieldManagers.
     * @example
     * // Create many FieldManagers
     * const fieldManager = await prisma.fieldManager.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FieldManagerCreateManyArgs>(args?: SelectSubset<T, FieldManagerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FieldManagers and returns the data saved in the database.
     * @param {FieldManagerCreateManyAndReturnArgs} args - Arguments to create many FieldManagers.
     * @example
     * // Create many FieldManagers
     * const fieldManager = await prisma.fieldManager.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FieldManagers and only return the `id`
     * const fieldManagerWithIdOnly = await prisma.fieldManager.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FieldManagerCreateManyAndReturnArgs>(args?: SelectSubset<T, FieldManagerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a FieldManager.
     * @param {FieldManagerDeleteArgs} args - Arguments to delete one FieldManager.
     * @example
     * // Delete one FieldManager
     * const FieldManager = await prisma.fieldManager.delete({
     *   where: {
     *     // ... filter to delete one FieldManager
     *   }
     * })
     * 
     */
    delete<T extends FieldManagerDeleteArgs>(args: SelectSubset<T, FieldManagerDeleteArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one FieldManager.
     * @param {FieldManagerUpdateArgs} args - Arguments to update one FieldManager.
     * @example
     * // Update one FieldManager
     * const fieldManager = await prisma.fieldManager.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FieldManagerUpdateArgs>(args: SelectSubset<T, FieldManagerUpdateArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more FieldManagers.
     * @param {FieldManagerDeleteManyArgs} args - Arguments to filter FieldManagers to delete.
     * @example
     * // Delete a few FieldManagers
     * const { count } = await prisma.fieldManager.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FieldManagerDeleteManyArgs>(args?: SelectSubset<T, FieldManagerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FieldManagers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FieldManagers
     * const fieldManager = await prisma.fieldManager.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FieldManagerUpdateManyArgs>(args: SelectSubset<T, FieldManagerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one FieldManager.
     * @param {FieldManagerUpsertArgs} args - Arguments to update or create a FieldManager.
     * @example
     * // Update or create a FieldManager
     * const fieldManager = await prisma.fieldManager.upsert({
     *   create: {
     *     // ... data to create a FieldManager
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FieldManager we want to update
     *   }
     * })
     */
    upsert<T extends FieldManagerUpsertArgs>(args: SelectSubset<T, FieldManagerUpsertArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of FieldManagers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerCountArgs} args - Arguments to filter FieldManagers to count.
     * @example
     * // Count the number of FieldManagers
     * const count = await prisma.fieldManager.count({
     *   where: {
     *     // ... the filter for the FieldManagers we want to count
     *   }
     * })
    **/
    count<T extends FieldManagerCountArgs>(
      args?: Subset<T, FieldManagerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FieldManagerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FieldManager.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FieldManagerAggregateArgs>(args: Subset<T, FieldManagerAggregateArgs>): Prisma.PrismaPromise<GetFieldManagerAggregateType<T>>

    /**
     * Group by FieldManager.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FieldManagerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FieldManagerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FieldManagerGroupByArgs['orderBy'] }
        : { orderBy?: FieldManagerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FieldManagerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFieldManagerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FieldManager model
   */
  readonly fields: FieldManagerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FieldManager.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FieldManagerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    teams<T extends FieldManager$teamsArgs<ExtArgs> = {}>(args?: Subset<T, FieldManager$teamsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FieldManager model
   */ 
  interface FieldManagerFieldRefs {
    readonly id: FieldRef<"FieldManager", 'String'>
    readonly userId: FieldRef<"FieldManager", 'String'>
    readonly name: FieldRef<"FieldManager", 'String'>
    readonly photo: FieldRef<"FieldManager", 'String'>
    readonly zone: FieldRef<"FieldManager", 'String'>
    readonly isAvailable: FieldRef<"FieldManager", 'Boolean'>
    readonly createdAt: FieldRef<"FieldManager", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FieldManager findUnique
   */
  export type FieldManagerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * Filter, which FieldManager to fetch.
     */
    where: FieldManagerWhereUniqueInput
  }

  /**
   * FieldManager findUniqueOrThrow
   */
  export type FieldManagerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * Filter, which FieldManager to fetch.
     */
    where: FieldManagerWhereUniqueInput
  }

  /**
   * FieldManager findFirst
   */
  export type FieldManagerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * Filter, which FieldManager to fetch.
     */
    where?: FieldManagerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FieldManagers to fetch.
     */
    orderBy?: FieldManagerOrderByWithRelationInput | FieldManagerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FieldManagers.
     */
    cursor?: FieldManagerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FieldManagers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FieldManagers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FieldManagers.
     */
    distinct?: FieldManagerScalarFieldEnum | FieldManagerScalarFieldEnum[]
  }

  /**
   * FieldManager findFirstOrThrow
   */
  export type FieldManagerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * Filter, which FieldManager to fetch.
     */
    where?: FieldManagerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FieldManagers to fetch.
     */
    orderBy?: FieldManagerOrderByWithRelationInput | FieldManagerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FieldManagers.
     */
    cursor?: FieldManagerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FieldManagers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FieldManagers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FieldManagers.
     */
    distinct?: FieldManagerScalarFieldEnum | FieldManagerScalarFieldEnum[]
  }

  /**
   * FieldManager findMany
   */
  export type FieldManagerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * Filter, which FieldManagers to fetch.
     */
    where?: FieldManagerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FieldManagers to fetch.
     */
    orderBy?: FieldManagerOrderByWithRelationInput | FieldManagerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FieldManagers.
     */
    cursor?: FieldManagerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FieldManagers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FieldManagers.
     */
    skip?: number
    distinct?: FieldManagerScalarFieldEnum | FieldManagerScalarFieldEnum[]
  }

  /**
   * FieldManager create
   */
  export type FieldManagerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * The data needed to create a FieldManager.
     */
    data: XOR<FieldManagerCreateInput, FieldManagerUncheckedCreateInput>
  }

  /**
   * FieldManager createMany
   */
  export type FieldManagerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FieldManagers.
     */
    data: FieldManagerCreateManyInput | FieldManagerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FieldManager createManyAndReturn
   */
  export type FieldManagerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many FieldManagers.
     */
    data: FieldManagerCreateManyInput | FieldManagerCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * FieldManager update
   */
  export type FieldManagerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * The data needed to update a FieldManager.
     */
    data: XOR<FieldManagerUpdateInput, FieldManagerUncheckedUpdateInput>
    /**
     * Choose, which FieldManager to update.
     */
    where: FieldManagerWhereUniqueInput
  }

  /**
   * FieldManager updateMany
   */
  export type FieldManagerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FieldManagers.
     */
    data: XOR<FieldManagerUpdateManyMutationInput, FieldManagerUncheckedUpdateManyInput>
    /**
     * Filter which FieldManagers to update
     */
    where?: FieldManagerWhereInput
  }

  /**
   * FieldManager upsert
   */
  export type FieldManagerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * The filter to search for the FieldManager to update in case it exists.
     */
    where: FieldManagerWhereUniqueInput
    /**
     * In case the FieldManager found by the `where` argument doesn't exist, create a new FieldManager with this data.
     */
    create: XOR<FieldManagerCreateInput, FieldManagerUncheckedCreateInput>
    /**
     * In case the FieldManager was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FieldManagerUpdateInput, FieldManagerUncheckedUpdateInput>
  }

  /**
   * FieldManager delete
   */
  export type FieldManagerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
    /**
     * Filter which FieldManager to delete.
     */
    where: FieldManagerWhereUniqueInput
  }

  /**
   * FieldManager deleteMany
   */
  export type FieldManagerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FieldManagers to delete
     */
    where?: FieldManagerWhereInput
  }

  /**
   * FieldManager.teams
   */
  export type FieldManager$teamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    cursor?: TeamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * FieldManager without action
   */
  export type FieldManagerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FieldManager
     */
    select?: FieldManagerSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FieldManagerInclude<ExtArgs> | null
  }


  /**
   * Model Team
   */

  export type AggregateTeam = {
    _count: TeamCountAggregateOutputType | null
    _min: TeamMinAggregateOutputType | null
    _max: TeamMaxAggregateOutputType | null
  }

  export type TeamMinAggregateOutputType = {
    id: string | null
    name: string | null
    fieldManagerId: string | null
    zone: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TeamMaxAggregateOutputType = {
    id: string | null
    name: string | null
    fieldManagerId: string | null
    zone: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TeamCountAggregateOutputType = {
    id: number
    name: number
    fieldManagerId: number
    zone: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TeamMinAggregateInputType = {
    id?: true
    name?: true
    fieldManagerId?: true
    zone?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TeamMaxAggregateInputType = {
    id?: true
    name?: true
    fieldManagerId?: true
    zone?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TeamCountAggregateInputType = {
    id?: true
    name?: true
    fieldManagerId?: true
    zone?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TeamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Team to aggregate.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Teams
    **/
    _count?: true | TeamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeamMaxAggregateInputType
  }

  export type GetTeamAggregateType<T extends TeamAggregateArgs> = {
        [P in keyof T & keyof AggregateTeam]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeam[P]>
      : GetScalarType<T[P], AggregateTeam[P]>
  }




  export type TeamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithAggregationInput | TeamOrderByWithAggregationInput[]
    by: TeamScalarFieldEnum[] | TeamScalarFieldEnum
    having?: TeamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeamCountAggregateInputType | true
    _min?: TeamMinAggregateInputType
    _max?: TeamMaxAggregateInputType
  }

  export type TeamGroupByOutputType = {
    id: string
    name: string
    fieldManagerId: string
    zone: string
    createdAt: Date
    updatedAt: Date
    _count: TeamCountAggregateOutputType | null
    _min: TeamMinAggregateOutputType | null
    _max: TeamMaxAggregateOutputType | null
  }

  type GetTeamGroupByPayload<T extends TeamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeamGroupByOutputType[P]>
            : GetScalarType<T[P], TeamGroupByOutputType[P]>
        }
      >
    >


  export type TeamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    fieldManagerId?: boolean
    zone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    fieldManager?: boolean | FieldManagerDefaultArgs<ExtArgs>
    careCompanions?: boolean | Team$careCompanionsArgs<ExtArgs>
    _count?: boolean | TeamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    fieldManagerId?: boolean
    zone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    fieldManager?: boolean | FieldManagerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectScalar = {
    id?: boolean
    name?: boolean
    fieldManagerId?: boolean
    zone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TeamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fieldManager?: boolean | FieldManagerDefaultArgs<ExtArgs>
    careCompanions?: boolean | Team$careCompanionsArgs<ExtArgs>
    _count?: boolean | TeamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TeamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fieldManager?: boolean | FieldManagerDefaultArgs<ExtArgs>
  }

  export type $TeamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Team"
    objects: {
      fieldManager: Prisma.$FieldManagerPayload<ExtArgs>
      careCompanions: Prisma.$CareCompanionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      fieldManagerId: string
      zone: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["team"]>
    composites: {}
  }

  type TeamGetPayload<S extends boolean | null | undefined | TeamDefaultArgs> = $Result.GetResult<Prisma.$TeamPayload, S>

  type TeamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TeamFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TeamCountAggregateInputType | true
    }

  export interface TeamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Team'], meta: { name: 'Team' } }
    /**
     * Find zero or one Team that matches the filter.
     * @param {TeamFindUniqueArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeamFindUniqueArgs>(args: SelectSubset<T, TeamFindUniqueArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Team that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TeamFindUniqueOrThrowArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeamFindUniqueOrThrowArgs>(args: SelectSubset<T, TeamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Team that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindFirstArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeamFindFirstArgs>(args?: SelectSubset<T, TeamFindFirstArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Team that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindFirstOrThrowArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeamFindFirstOrThrowArgs>(args?: SelectSubset<T, TeamFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Teams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Teams
     * const teams = await prisma.team.findMany()
     * 
     * // Get first 10 Teams
     * const teams = await prisma.team.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teamWithIdOnly = await prisma.team.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeamFindManyArgs>(args?: SelectSubset<T, TeamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Team.
     * @param {TeamCreateArgs} args - Arguments to create a Team.
     * @example
     * // Create one Team
     * const Team = await prisma.team.create({
     *   data: {
     *     // ... data to create a Team
     *   }
     * })
     * 
     */
    create<T extends TeamCreateArgs>(args: SelectSubset<T, TeamCreateArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Teams.
     * @param {TeamCreateManyArgs} args - Arguments to create many Teams.
     * @example
     * // Create many Teams
     * const team = await prisma.team.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeamCreateManyArgs>(args?: SelectSubset<T, TeamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Teams and returns the data saved in the database.
     * @param {TeamCreateManyAndReturnArgs} args - Arguments to create many Teams.
     * @example
     * // Create many Teams
     * const team = await prisma.team.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Teams and only return the `id`
     * const teamWithIdOnly = await prisma.team.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeamCreateManyAndReturnArgs>(args?: SelectSubset<T, TeamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Team.
     * @param {TeamDeleteArgs} args - Arguments to delete one Team.
     * @example
     * // Delete one Team
     * const Team = await prisma.team.delete({
     *   where: {
     *     // ... filter to delete one Team
     *   }
     * })
     * 
     */
    delete<T extends TeamDeleteArgs>(args: SelectSubset<T, TeamDeleteArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Team.
     * @param {TeamUpdateArgs} args - Arguments to update one Team.
     * @example
     * // Update one Team
     * const team = await prisma.team.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeamUpdateArgs>(args: SelectSubset<T, TeamUpdateArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Teams.
     * @param {TeamDeleteManyArgs} args - Arguments to filter Teams to delete.
     * @example
     * // Delete a few Teams
     * const { count } = await prisma.team.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeamDeleteManyArgs>(args?: SelectSubset<T, TeamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Teams
     * const team = await prisma.team.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeamUpdateManyArgs>(args: SelectSubset<T, TeamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Team.
     * @param {TeamUpsertArgs} args - Arguments to update or create a Team.
     * @example
     * // Update or create a Team
     * const team = await prisma.team.upsert({
     *   create: {
     *     // ... data to create a Team
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Team we want to update
     *   }
     * })
     */
    upsert<T extends TeamUpsertArgs>(args: SelectSubset<T, TeamUpsertArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Teams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamCountArgs} args - Arguments to filter Teams to count.
     * @example
     * // Count the number of Teams
     * const count = await prisma.team.count({
     *   where: {
     *     // ... the filter for the Teams we want to count
     *   }
     * })
    **/
    count<T extends TeamCountArgs>(
      args?: Subset<T, TeamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Team.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeamAggregateArgs>(args: Subset<T, TeamAggregateArgs>): Prisma.PrismaPromise<GetTeamAggregateType<T>>

    /**
     * Group by Team.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeamGroupByArgs['orderBy'] }
        : { orderBy?: TeamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Team model
   */
  readonly fields: TeamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Team.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    fieldManager<T extends FieldManagerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FieldManagerDefaultArgs<ExtArgs>>): Prisma__FieldManagerClient<$Result.GetResult<Prisma.$FieldManagerPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    careCompanions<T extends Team$careCompanionsArgs<ExtArgs> = {}>(args?: Subset<T, Team$careCompanionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Team model
   */ 
  interface TeamFieldRefs {
    readonly id: FieldRef<"Team", 'String'>
    readonly name: FieldRef<"Team", 'String'>
    readonly fieldManagerId: FieldRef<"Team", 'String'>
    readonly zone: FieldRef<"Team", 'String'>
    readonly createdAt: FieldRef<"Team", 'DateTime'>
    readonly updatedAt: FieldRef<"Team", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Team findUnique
   */
  export type TeamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team findUniqueOrThrow
   */
  export type TeamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team findFirst
   */
  export type TeamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teams.
     */
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team findFirstOrThrow
   */
  export type TeamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teams.
     */
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team findMany
   */
  export type TeamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Teams to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team create
   */
  export type TeamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The data needed to create a Team.
     */
    data: XOR<TeamCreateInput, TeamUncheckedCreateInput>
  }

  /**
   * Team createMany
   */
  export type TeamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Teams.
     */
    data: TeamCreateManyInput | TeamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Team createManyAndReturn
   */
  export type TeamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Teams.
     */
    data: TeamCreateManyInput | TeamCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Team update
   */
  export type TeamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The data needed to update a Team.
     */
    data: XOR<TeamUpdateInput, TeamUncheckedUpdateInput>
    /**
     * Choose, which Team to update.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team updateMany
   */
  export type TeamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Teams.
     */
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyInput>
    /**
     * Filter which Teams to update
     */
    where?: TeamWhereInput
  }

  /**
   * Team upsert
   */
  export type TeamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The filter to search for the Team to update in case it exists.
     */
    where: TeamWhereUniqueInput
    /**
     * In case the Team found by the `where` argument doesn't exist, create a new Team with this data.
     */
    create: XOR<TeamCreateInput, TeamUncheckedCreateInput>
    /**
     * In case the Team was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeamUpdateInput, TeamUncheckedUpdateInput>
  }

  /**
   * Team delete
   */
  export type TeamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter which Team to delete.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team deleteMany
   */
  export type TeamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Teams to delete
     */
    where?: TeamWhereInput
  }

  /**
   * Team.careCompanions
   */
  export type Team$careCompanionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    where?: CareCompanionWhereInput
    orderBy?: CareCompanionOrderByWithRelationInput | CareCompanionOrderByWithRelationInput[]
    cursor?: CareCompanionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CareCompanionScalarFieldEnum | CareCompanionScalarFieldEnum[]
  }

  /**
   * Team without action
   */
  export type TeamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
  }


  /**
   * Model CareCompanion
   */

  export type AggregateCareCompanion = {
    _count: CareCompanionCountAggregateOutputType | null
    _min: CareCompanionMinAggregateOutputType | null
    _max: CareCompanionMaxAggregateOutputType | null
  }

  export type CareCompanionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    photo: string | null
    bio: string | null
    zone: string | null
    isAvailable: boolean | null
    teamId: string | null
    createdAt: Date | null
  }

  export type CareCompanionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    name: string | null
    photo: string | null
    bio: string | null
    zone: string | null
    isAvailable: boolean | null
    teamId: string | null
    createdAt: Date | null
  }

  export type CareCompanionCountAggregateOutputType = {
    id: number
    userId: number
    name: number
    photo: number
    bio: number
    specialization: number
    zone: number
    isAvailable: number
    teamId: number
    createdAt: number
    _all: number
  }


  export type CareCompanionMinAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    photo?: true
    bio?: true
    zone?: true
    isAvailable?: true
    teamId?: true
    createdAt?: true
  }

  export type CareCompanionMaxAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    photo?: true
    bio?: true
    zone?: true
    isAvailable?: true
    teamId?: true
    createdAt?: true
  }

  export type CareCompanionCountAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    photo?: true
    bio?: true
    specialization?: true
    zone?: true
    isAvailable?: true
    teamId?: true
    createdAt?: true
    _all?: true
  }

  export type CareCompanionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CareCompanion to aggregate.
     */
    where?: CareCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CareCompanions to fetch.
     */
    orderBy?: CareCompanionOrderByWithRelationInput | CareCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CareCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CareCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CareCompanions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CareCompanions
    **/
    _count?: true | CareCompanionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CareCompanionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CareCompanionMaxAggregateInputType
  }

  export type GetCareCompanionAggregateType<T extends CareCompanionAggregateArgs> = {
        [P in keyof T & keyof AggregateCareCompanion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCareCompanion[P]>
      : GetScalarType<T[P], AggregateCareCompanion[P]>
  }




  export type CareCompanionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CareCompanionWhereInput
    orderBy?: CareCompanionOrderByWithAggregationInput | CareCompanionOrderByWithAggregationInput[]
    by: CareCompanionScalarFieldEnum[] | CareCompanionScalarFieldEnum
    having?: CareCompanionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CareCompanionCountAggregateInputType | true
    _min?: CareCompanionMinAggregateInputType
    _max?: CareCompanionMaxAggregateInputType
  }

  export type CareCompanionGroupByOutputType = {
    id: string
    userId: string
    name: string
    photo: string | null
    bio: string
    specialization: string[]
    zone: string
    isAvailable: boolean
    teamId: string | null
    createdAt: Date
    _count: CareCompanionCountAggregateOutputType | null
    _min: CareCompanionMinAggregateOutputType | null
    _max: CareCompanionMaxAggregateOutputType | null
  }

  type GetCareCompanionGroupByPayload<T extends CareCompanionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CareCompanionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CareCompanionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CareCompanionGroupByOutputType[P]>
            : GetScalarType<T[P], CareCompanionGroupByOutputType[P]>
        }
      >
    >


  export type CareCompanionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    photo?: boolean
    bio?: boolean
    specialization?: boolean
    zone?: boolean
    isAvailable?: boolean
    teamId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | CareCompanion$teamArgs<ExtArgs>
  }, ExtArgs["result"]["careCompanion"]>

  export type CareCompanionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    photo?: boolean
    bio?: boolean
    specialization?: boolean
    zone?: boolean
    isAvailable?: boolean
    teamId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | CareCompanion$teamArgs<ExtArgs>
  }, ExtArgs["result"]["careCompanion"]>

  export type CareCompanionSelectScalar = {
    id?: boolean
    userId?: boolean
    name?: boolean
    photo?: boolean
    bio?: boolean
    specialization?: boolean
    zone?: boolean
    isAvailable?: boolean
    teamId?: boolean
    createdAt?: boolean
  }

  export type CareCompanionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | CareCompanion$teamArgs<ExtArgs>
  }
  export type CareCompanionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | CareCompanion$teamArgs<ExtArgs>
  }

  export type $CareCompanionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CareCompanion"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      team: Prisma.$TeamPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      name: string
      photo: string | null
      bio: string
      specialization: string[]
      zone: string
      isAvailable: boolean
      teamId: string | null
      createdAt: Date
    }, ExtArgs["result"]["careCompanion"]>
    composites: {}
  }

  type CareCompanionGetPayload<S extends boolean | null | undefined | CareCompanionDefaultArgs> = $Result.GetResult<Prisma.$CareCompanionPayload, S>

  type CareCompanionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CareCompanionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CareCompanionCountAggregateInputType | true
    }

  export interface CareCompanionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CareCompanion'], meta: { name: 'CareCompanion' } }
    /**
     * Find zero or one CareCompanion that matches the filter.
     * @param {CareCompanionFindUniqueArgs} args - Arguments to find a CareCompanion
     * @example
     * // Get one CareCompanion
     * const careCompanion = await prisma.careCompanion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CareCompanionFindUniqueArgs>(args: SelectSubset<T, CareCompanionFindUniqueArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CareCompanion that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CareCompanionFindUniqueOrThrowArgs} args - Arguments to find a CareCompanion
     * @example
     * // Get one CareCompanion
     * const careCompanion = await prisma.careCompanion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CareCompanionFindUniqueOrThrowArgs>(args: SelectSubset<T, CareCompanionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CareCompanion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionFindFirstArgs} args - Arguments to find a CareCompanion
     * @example
     * // Get one CareCompanion
     * const careCompanion = await prisma.careCompanion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CareCompanionFindFirstArgs>(args?: SelectSubset<T, CareCompanionFindFirstArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CareCompanion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionFindFirstOrThrowArgs} args - Arguments to find a CareCompanion
     * @example
     * // Get one CareCompanion
     * const careCompanion = await prisma.careCompanion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CareCompanionFindFirstOrThrowArgs>(args?: SelectSubset<T, CareCompanionFindFirstOrThrowArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CareCompanions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CareCompanions
     * const careCompanions = await prisma.careCompanion.findMany()
     * 
     * // Get first 10 CareCompanions
     * const careCompanions = await prisma.careCompanion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const careCompanionWithIdOnly = await prisma.careCompanion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CareCompanionFindManyArgs>(args?: SelectSubset<T, CareCompanionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CareCompanion.
     * @param {CareCompanionCreateArgs} args - Arguments to create a CareCompanion.
     * @example
     * // Create one CareCompanion
     * const CareCompanion = await prisma.careCompanion.create({
     *   data: {
     *     // ... data to create a CareCompanion
     *   }
     * })
     * 
     */
    create<T extends CareCompanionCreateArgs>(args: SelectSubset<T, CareCompanionCreateArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CareCompanions.
     * @param {CareCompanionCreateManyArgs} args - Arguments to create many CareCompanions.
     * @example
     * // Create many CareCompanions
     * const careCompanion = await prisma.careCompanion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CareCompanionCreateManyArgs>(args?: SelectSubset<T, CareCompanionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CareCompanions and returns the data saved in the database.
     * @param {CareCompanionCreateManyAndReturnArgs} args - Arguments to create many CareCompanions.
     * @example
     * // Create many CareCompanions
     * const careCompanion = await prisma.careCompanion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CareCompanions and only return the `id`
     * const careCompanionWithIdOnly = await prisma.careCompanion.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CareCompanionCreateManyAndReturnArgs>(args?: SelectSubset<T, CareCompanionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CareCompanion.
     * @param {CareCompanionDeleteArgs} args - Arguments to delete one CareCompanion.
     * @example
     * // Delete one CareCompanion
     * const CareCompanion = await prisma.careCompanion.delete({
     *   where: {
     *     // ... filter to delete one CareCompanion
     *   }
     * })
     * 
     */
    delete<T extends CareCompanionDeleteArgs>(args: SelectSubset<T, CareCompanionDeleteArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CareCompanion.
     * @param {CareCompanionUpdateArgs} args - Arguments to update one CareCompanion.
     * @example
     * // Update one CareCompanion
     * const careCompanion = await prisma.careCompanion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CareCompanionUpdateArgs>(args: SelectSubset<T, CareCompanionUpdateArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CareCompanions.
     * @param {CareCompanionDeleteManyArgs} args - Arguments to filter CareCompanions to delete.
     * @example
     * // Delete a few CareCompanions
     * const { count } = await prisma.careCompanion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CareCompanionDeleteManyArgs>(args?: SelectSubset<T, CareCompanionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CareCompanions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CareCompanions
     * const careCompanion = await prisma.careCompanion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CareCompanionUpdateManyArgs>(args: SelectSubset<T, CareCompanionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CareCompanion.
     * @param {CareCompanionUpsertArgs} args - Arguments to update or create a CareCompanion.
     * @example
     * // Update or create a CareCompanion
     * const careCompanion = await prisma.careCompanion.upsert({
     *   create: {
     *     // ... data to create a CareCompanion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CareCompanion we want to update
     *   }
     * })
     */
    upsert<T extends CareCompanionUpsertArgs>(args: SelectSubset<T, CareCompanionUpsertArgs<ExtArgs>>): Prisma__CareCompanionClient<$Result.GetResult<Prisma.$CareCompanionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CareCompanions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionCountArgs} args - Arguments to filter CareCompanions to count.
     * @example
     * // Count the number of CareCompanions
     * const count = await prisma.careCompanion.count({
     *   where: {
     *     // ... the filter for the CareCompanions we want to count
     *   }
     * })
    **/
    count<T extends CareCompanionCountArgs>(
      args?: Subset<T, CareCompanionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CareCompanionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CareCompanion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CareCompanionAggregateArgs>(args: Subset<T, CareCompanionAggregateArgs>): Prisma.PrismaPromise<GetCareCompanionAggregateType<T>>

    /**
     * Group by CareCompanion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareCompanionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CareCompanionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CareCompanionGroupByArgs['orderBy'] }
        : { orderBy?: CareCompanionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CareCompanionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCareCompanionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CareCompanion model
   */
  readonly fields: CareCompanionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CareCompanion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CareCompanionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    team<T extends CareCompanion$teamArgs<ExtArgs> = {}>(args?: Subset<T, CareCompanion$teamArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CareCompanion model
   */ 
  interface CareCompanionFieldRefs {
    readonly id: FieldRef<"CareCompanion", 'String'>
    readonly userId: FieldRef<"CareCompanion", 'String'>
    readonly name: FieldRef<"CareCompanion", 'String'>
    readonly photo: FieldRef<"CareCompanion", 'String'>
    readonly bio: FieldRef<"CareCompanion", 'String'>
    readonly specialization: FieldRef<"CareCompanion", 'String[]'>
    readonly zone: FieldRef<"CareCompanion", 'String'>
    readonly isAvailable: FieldRef<"CareCompanion", 'Boolean'>
    readonly teamId: FieldRef<"CareCompanion", 'String'>
    readonly createdAt: FieldRef<"CareCompanion", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CareCompanion findUnique
   */
  export type CareCompanionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * Filter, which CareCompanion to fetch.
     */
    where: CareCompanionWhereUniqueInput
  }

  /**
   * CareCompanion findUniqueOrThrow
   */
  export type CareCompanionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * Filter, which CareCompanion to fetch.
     */
    where: CareCompanionWhereUniqueInput
  }

  /**
   * CareCompanion findFirst
   */
  export type CareCompanionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * Filter, which CareCompanion to fetch.
     */
    where?: CareCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CareCompanions to fetch.
     */
    orderBy?: CareCompanionOrderByWithRelationInput | CareCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CareCompanions.
     */
    cursor?: CareCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CareCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CareCompanions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CareCompanions.
     */
    distinct?: CareCompanionScalarFieldEnum | CareCompanionScalarFieldEnum[]
  }

  /**
   * CareCompanion findFirstOrThrow
   */
  export type CareCompanionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * Filter, which CareCompanion to fetch.
     */
    where?: CareCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CareCompanions to fetch.
     */
    orderBy?: CareCompanionOrderByWithRelationInput | CareCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CareCompanions.
     */
    cursor?: CareCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CareCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CareCompanions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CareCompanions.
     */
    distinct?: CareCompanionScalarFieldEnum | CareCompanionScalarFieldEnum[]
  }

  /**
   * CareCompanion findMany
   */
  export type CareCompanionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * Filter, which CareCompanions to fetch.
     */
    where?: CareCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CareCompanions to fetch.
     */
    orderBy?: CareCompanionOrderByWithRelationInput | CareCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CareCompanions.
     */
    cursor?: CareCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CareCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CareCompanions.
     */
    skip?: number
    distinct?: CareCompanionScalarFieldEnum | CareCompanionScalarFieldEnum[]
  }

  /**
   * CareCompanion create
   */
  export type CareCompanionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * The data needed to create a CareCompanion.
     */
    data: XOR<CareCompanionCreateInput, CareCompanionUncheckedCreateInput>
  }

  /**
   * CareCompanion createMany
   */
  export type CareCompanionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CareCompanions.
     */
    data: CareCompanionCreateManyInput | CareCompanionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CareCompanion createManyAndReturn
   */
  export type CareCompanionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CareCompanions.
     */
    data: CareCompanionCreateManyInput | CareCompanionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CareCompanion update
   */
  export type CareCompanionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * The data needed to update a CareCompanion.
     */
    data: XOR<CareCompanionUpdateInput, CareCompanionUncheckedUpdateInput>
    /**
     * Choose, which CareCompanion to update.
     */
    where: CareCompanionWhereUniqueInput
  }

  /**
   * CareCompanion updateMany
   */
  export type CareCompanionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CareCompanions.
     */
    data: XOR<CareCompanionUpdateManyMutationInput, CareCompanionUncheckedUpdateManyInput>
    /**
     * Filter which CareCompanions to update
     */
    where?: CareCompanionWhereInput
  }

  /**
   * CareCompanion upsert
   */
  export type CareCompanionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * The filter to search for the CareCompanion to update in case it exists.
     */
    where: CareCompanionWhereUniqueInput
    /**
     * In case the CareCompanion found by the `where` argument doesn't exist, create a new CareCompanion with this data.
     */
    create: XOR<CareCompanionCreateInput, CareCompanionUncheckedCreateInput>
    /**
     * In case the CareCompanion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CareCompanionUpdateInput, CareCompanionUncheckedUpdateInput>
  }

  /**
   * CareCompanion delete
   */
  export type CareCompanionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
    /**
     * Filter which CareCompanion to delete.
     */
    where: CareCompanionWhereUniqueInput
  }

  /**
   * CareCompanion deleteMany
   */
  export type CareCompanionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CareCompanions to delete
     */
    where?: CareCompanionWhereInput
  }

  /**
   * CareCompanion.team
   */
  export type CareCompanion$teamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
  }

  /**
   * CareCompanion without action
   */
  export type CareCompanionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareCompanion
     */
    select?: CareCompanionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareCompanionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    phone: 'phone',
    role: 'role'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ZoneScalarFieldEnum: {
    id: 'id',
    name: 'name',
    city: 'city',
    address: 'address',
    state: 'state',
    pincode: 'pincode',
    latitude: 'latitude',
    longitude: 'longitude',
    phone: 'phone',
    leaseStartDate: 'leaseStartDate',
    leaseEndDate: 'leaseEndDate',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    fieldManagerId: 'fieldManagerId'
  };

  export type ZoneScalarFieldEnum = (typeof ZoneScalarFieldEnum)[keyof typeof ZoneScalarFieldEnum]


  export const CallbackRequestScalarFieldEnum: {
    id: 'id',
    name: 'name',
    phone: 'phone',
    subscriberId: 'subscriberId',
    beneficiaryId: 'beneficiaryId',
    status: 'status',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CallbackRequestScalarFieldEnum = (typeof CallbackRequestScalarFieldEnum)[keyof typeof CallbackRequestScalarFieldEnum]


  export const FieldManagerScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    photo: 'photo',
    zone: 'zone',
    isAvailable: 'isAvailable',
    createdAt: 'createdAt'
  };

  export type FieldManagerScalarFieldEnum = (typeof FieldManagerScalarFieldEnum)[keyof typeof FieldManagerScalarFieldEnum]


  export const TeamScalarFieldEnum: {
    id: 'id',
    name: 'name',
    fieldManagerId: 'fieldManagerId',
    zone: 'zone',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TeamScalarFieldEnum = (typeof TeamScalarFieldEnum)[keyof typeof TeamScalarFieldEnum]


  export const CareCompanionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    photo: 'photo',
    bio: 'bio',
    specialization: 'specialization',
    zone: 'zone',
    isAvailable: 'isAvailable',
    teamId: 'teamId',
    createdAt: 'createdAt'
  };

  export type CareCompanionScalarFieldEnum = (typeof CareCompanionScalarFieldEnum)[keyof typeof CareCompanionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'CallbackStatus'
   */
  export type EnumCallbackStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CallbackStatus'>
    


  /**
   * Reference to a field of type 'CallbackStatus[]'
   */
  export type ListEnumCallbackStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CallbackStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    phone?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    fieldManagerProfile?: XOR<FieldManagerNullableRelationFilter, FieldManagerWhereInput> | null
    careCompanionProfile?: XOR<CareCompanionNullableRelationFilter, CareCompanionWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    phone?: SortOrder
    role?: SortOrder
    fieldManagerProfile?: FieldManagerOrderByWithRelationInput
    careCompanionProfile?: CareCompanionOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    phone?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    fieldManagerProfile?: XOR<FieldManagerNullableRelationFilter, FieldManagerWhereInput> | null
    careCompanionProfile?: XOR<CareCompanionNullableRelationFilter, CareCompanionWhereInput> | null
  }, "id" | "phone">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    phone?: SortOrder
    role?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    phone?: StringWithAggregatesFilter<"User"> | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
  }

  export type ZoneWhereInput = {
    AND?: ZoneWhereInput | ZoneWhereInput[]
    OR?: ZoneWhereInput[]
    NOT?: ZoneWhereInput | ZoneWhereInput[]
    id?: StringFilter<"Zone"> | string
    name?: StringFilter<"Zone"> | string
    city?: StringFilter<"Zone"> | string
    address?: StringFilter<"Zone"> | string
    state?: StringFilter<"Zone"> | string
    pincode?: StringFilter<"Zone"> | string
    latitude?: FloatNullableFilter<"Zone"> | number | null
    longitude?: FloatNullableFilter<"Zone"> | number | null
    phone?: StringNullableFilter<"Zone"> | string | null
    leaseStartDate?: DateTimeNullableFilter<"Zone"> | Date | string | null
    leaseEndDate?: DateTimeNullableFilter<"Zone"> | Date | string | null
    isActive?: BoolFilter<"Zone"> | boolean
    createdAt?: DateTimeFilter<"Zone"> | Date | string
    updatedAt?: DateTimeFilter<"Zone"> | Date | string
    fieldManagerId?: StringNullableFilter<"Zone"> | string | null
  }

  export type ZoneOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    city?: SortOrder
    address?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    leaseStartDate?: SortOrderInput | SortOrder
    leaseEndDate?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    fieldManagerId?: SortOrderInput | SortOrder
  }

  export type ZoneWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ZoneWhereInput | ZoneWhereInput[]
    OR?: ZoneWhereInput[]
    NOT?: ZoneWhereInput | ZoneWhereInput[]
    name?: StringFilter<"Zone"> | string
    city?: StringFilter<"Zone"> | string
    address?: StringFilter<"Zone"> | string
    state?: StringFilter<"Zone"> | string
    pincode?: StringFilter<"Zone"> | string
    latitude?: FloatNullableFilter<"Zone"> | number | null
    longitude?: FloatNullableFilter<"Zone"> | number | null
    phone?: StringNullableFilter<"Zone"> | string | null
    leaseStartDate?: DateTimeNullableFilter<"Zone"> | Date | string | null
    leaseEndDate?: DateTimeNullableFilter<"Zone"> | Date | string | null
    isActive?: BoolFilter<"Zone"> | boolean
    createdAt?: DateTimeFilter<"Zone"> | Date | string
    updatedAt?: DateTimeFilter<"Zone"> | Date | string
    fieldManagerId?: StringNullableFilter<"Zone"> | string | null
  }, "id">

  export type ZoneOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    city?: SortOrder
    address?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    leaseStartDate?: SortOrderInput | SortOrder
    leaseEndDate?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    fieldManagerId?: SortOrderInput | SortOrder
    _count?: ZoneCountOrderByAggregateInput
    _avg?: ZoneAvgOrderByAggregateInput
    _max?: ZoneMaxOrderByAggregateInput
    _min?: ZoneMinOrderByAggregateInput
    _sum?: ZoneSumOrderByAggregateInput
  }

  export type ZoneScalarWhereWithAggregatesInput = {
    AND?: ZoneScalarWhereWithAggregatesInput | ZoneScalarWhereWithAggregatesInput[]
    OR?: ZoneScalarWhereWithAggregatesInput[]
    NOT?: ZoneScalarWhereWithAggregatesInput | ZoneScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Zone"> | string
    name?: StringWithAggregatesFilter<"Zone"> | string
    city?: StringWithAggregatesFilter<"Zone"> | string
    address?: StringWithAggregatesFilter<"Zone"> | string
    state?: StringWithAggregatesFilter<"Zone"> | string
    pincode?: StringWithAggregatesFilter<"Zone"> | string
    latitude?: FloatNullableWithAggregatesFilter<"Zone"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"Zone"> | number | null
    phone?: StringNullableWithAggregatesFilter<"Zone"> | string | null
    leaseStartDate?: DateTimeNullableWithAggregatesFilter<"Zone"> | Date | string | null
    leaseEndDate?: DateTimeNullableWithAggregatesFilter<"Zone"> | Date | string | null
    isActive?: BoolWithAggregatesFilter<"Zone"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Zone"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Zone"> | Date | string
    fieldManagerId?: StringNullableWithAggregatesFilter<"Zone"> | string | null
  }

  export type CallbackRequestWhereInput = {
    AND?: CallbackRequestWhereInput | CallbackRequestWhereInput[]
    OR?: CallbackRequestWhereInput[]
    NOT?: CallbackRequestWhereInput | CallbackRequestWhereInput[]
    id?: StringFilter<"CallbackRequest"> | string
    name?: StringFilter<"CallbackRequest"> | string
    phone?: StringFilter<"CallbackRequest"> | string
    subscriberId?: StringNullableFilter<"CallbackRequest"> | string | null
    beneficiaryId?: StringNullableFilter<"CallbackRequest"> | string | null
    status?: EnumCallbackStatusFilter<"CallbackRequest"> | $Enums.CallbackStatus
    notes?: StringNullableFilter<"CallbackRequest"> | string | null
    createdAt?: DateTimeFilter<"CallbackRequest"> | Date | string
    updatedAt?: DateTimeFilter<"CallbackRequest"> | Date | string
  }

  export type CallbackRequestOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    subscriberId?: SortOrderInput | SortOrder
    beneficiaryId?: SortOrderInput | SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CallbackRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CallbackRequestWhereInput | CallbackRequestWhereInput[]
    OR?: CallbackRequestWhereInput[]
    NOT?: CallbackRequestWhereInput | CallbackRequestWhereInput[]
    name?: StringFilter<"CallbackRequest"> | string
    phone?: StringFilter<"CallbackRequest"> | string
    subscriberId?: StringNullableFilter<"CallbackRequest"> | string | null
    beneficiaryId?: StringNullableFilter<"CallbackRequest"> | string | null
    status?: EnumCallbackStatusFilter<"CallbackRequest"> | $Enums.CallbackStatus
    notes?: StringNullableFilter<"CallbackRequest"> | string | null
    createdAt?: DateTimeFilter<"CallbackRequest"> | Date | string
    updatedAt?: DateTimeFilter<"CallbackRequest"> | Date | string
  }, "id">

  export type CallbackRequestOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    subscriberId?: SortOrderInput | SortOrder
    beneficiaryId?: SortOrderInput | SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CallbackRequestCountOrderByAggregateInput
    _max?: CallbackRequestMaxOrderByAggregateInput
    _min?: CallbackRequestMinOrderByAggregateInput
  }

  export type CallbackRequestScalarWhereWithAggregatesInput = {
    AND?: CallbackRequestScalarWhereWithAggregatesInput | CallbackRequestScalarWhereWithAggregatesInput[]
    OR?: CallbackRequestScalarWhereWithAggregatesInput[]
    NOT?: CallbackRequestScalarWhereWithAggregatesInput | CallbackRequestScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CallbackRequest"> | string
    name?: StringWithAggregatesFilter<"CallbackRequest"> | string
    phone?: StringWithAggregatesFilter<"CallbackRequest"> | string
    subscriberId?: StringNullableWithAggregatesFilter<"CallbackRequest"> | string | null
    beneficiaryId?: StringNullableWithAggregatesFilter<"CallbackRequest"> | string | null
    status?: EnumCallbackStatusWithAggregatesFilter<"CallbackRequest"> | $Enums.CallbackStatus
    notes?: StringNullableWithAggregatesFilter<"CallbackRequest"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CallbackRequest"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CallbackRequest"> | Date | string
  }

  export type FieldManagerWhereInput = {
    AND?: FieldManagerWhereInput | FieldManagerWhereInput[]
    OR?: FieldManagerWhereInput[]
    NOT?: FieldManagerWhereInput | FieldManagerWhereInput[]
    id?: StringFilter<"FieldManager"> | string
    userId?: StringFilter<"FieldManager"> | string
    name?: StringFilter<"FieldManager"> | string
    photo?: StringNullableFilter<"FieldManager"> | string | null
    zone?: StringFilter<"FieldManager"> | string
    isAvailable?: BoolFilter<"FieldManager"> | boolean
    createdAt?: DateTimeFilter<"FieldManager"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    teams?: TeamListRelationFilter
  }

  export type FieldManagerOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrderInput | SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    teams?: TeamOrderByRelationAggregateInput
  }

  export type FieldManagerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: FieldManagerWhereInput | FieldManagerWhereInput[]
    OR?: FieldManagerWhereInput[]
    NOT?: FieldManagerWhereInput | FieldManagerWhereInput[]
    name?: StringFilter<"FieldManager"> | string
    photo?: StringNullableFilter<"FieldManager"> | string | null
    zone?: StringFilter<"FieldManager"> | string
    isAvailable?: BoolFilter<"FieldManager"> | boolean
    createdAt?: DateTimeFilter<"FieldManager"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    teams?: TeamListRelationFilter
  }, "id" | "userId">

  export type FieldManagerOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrderInput | SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    createdAt?: SortOrder
    _count?: FieldManagerCountOrderByAggregateInput
    _max?: FieldManagerMaxOrderByAggregateInput
    _min?: FieldManagerMinOrderByAggregateInput
  }

  export type FieldManagerScalarWhereWithAggregatesInput = {
    AND?: FieldManagerScalarWhereWithAggregatesInput | FieldManagerScalarWhereWithAggregatesInput[]
    OR?: FieldManagerScalarWhereWithAggregatesInput[]
    NOT?: FieldManagerScalarWhereWithAggregatesInput | FieldManagerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FieldManager"> | string
    userId?: StringWithAggregatesFilter<"FieldManager"> | string
    name?: StringWithAggregatesFilter<"FieldManager"> | string
    photo?: StringNullableWithAggregatesFilter<"FieldManager"> | string | null
    zone?: StringWithAggregatesFilter<"FieldManager"> | string
    isAvailable?: BoolWithAggregatesFilter<"FieldManager"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"FieldManager"> | Date | string
  }

  export type TeamWhereInput = {
    AND?: TeamWhereInput | TeamWhereInput[]
    OR?: TeamWhereInput[]
    NOT?: TeamWhereInput | TeamWhereInput[]
    id?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    fieldManagerId?: StringFilter<"Team"> | string
    zone?: StringFilter<"Team"> | string
    createdAt?: DateTimeFilter<"Team"> | Date | string
    updatedAt?: DateTimeFilter<"Team"> | Date | string
    fieldManager?: XOR<FieldManagerRelationFilter, FieldManagerWhereInput>
    careCompanions?: CareCompanionListRelationFilter
  }

  export type TeamOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    fieldManagerId?: SortOrder
    zone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    fieldManager?: FieldManagerOrderByWithRelationInput
    careCompanions?: CareCompanionOrderByRelationAggregateInput
  }

  export type TeamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TeamWhereInput | TeamWhereInput[]
    OR?: TeamWhereInput[]
    NOT?: TeamWhereInput | TeamWhereInput[]
    name?: StringFilter<"Team"> | string
    fieldManagerId?: StringFilter<"Team"> | string
    zone?: StringFilter<"Team"> | string
    createdAt?: DateTimeFilter<"Team"> | Date | string
    updatedAt?: DateTimeFilter<"Team"> | Date | string
    fieldManager?: XOR<FieldManagerRelationFilter, FieldManagerWhereInput>
    careCompanions?: CareCompanionListRelationFilter
  }, "id">

  export type TeamOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    fieldManagerId?: SortOrder
    zone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TeamCountOrderByAggregateInput
    _max?: TeamMaxOrderByAggregateInput
    _min?: TeamMinOrderByAggregateInput
  }

  export type TeamScalarWhereWithAggregatesInput = {
    AND?: TeamScalarWhereWithAggregatesInput | TeamScalarWhereWithAggregatesInput[]
    OR?: TeamScalarWhereWithAggregatesInput[]
    NOT?: TeamScalarWhereWithAggregatesInput | TeamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Team"> | string
    name?: StringWithAggregatesFilter<"Team"> | string
    fieldManagerId?: StringWithAggregatesFilter<"Team"> | string
    zone?: StringWithAggregatesFilter<"Team"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Team"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Team"> | Date | string
  }

  export type CareCompanionWhereInput = {
    AND?: CareCompanionWhereInput | CareCompanionWhereInput[]
    OR?: CareCompanionWhereInput[]
    NOT?: CareCompanionWhereInput | CareCompanionWhereInput[]
    id?: StringFilter<"CareCompanion"> | string
    userId?: StringFilter<"CareCompanion"> | string
    name?: StringFilter<"CareCompanion"> | string
    photo?: StringNullableFilter<"CareCompanion"> | string | null
    bio?: StringFilter<"CareCompanion"> | string
    specialization?: StringNullableListFilter<"CareCompanion">
    zone?: StringFilter<"CareCompanion"> | string
    isAvailable?: BoolFilter<"CareCompanion"> | boolean
    teamId?: StringNullableFilter<"CareCompanion"> | string | null
    createdAt?: DateTimeFilter<"CareCompanion"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    team?: XOR<TeamNullableRelationFilter, TeamWhereInput> | null
  }

  export type CareCompanionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrderInput | SortOrder
    bio?: SortOrder
    specialization?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    teamId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    team?: TeamOrderByWithRelationInput
  }

  export type CareCompanionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: CareCompanionWhereInput | CareCompanionWhereInput[]
    OR?: CareCompanionWhereInput[]
    NOT?: CareCompanionWhereInput | CareCompanionWhereInput[]
    name?: StringFilter<"CareCompanion"> | string
    photo?: StringNullableFilter<"CareCompanion"> | string | null
    bio?: StringFilter<"CareCompanion"> | string
    specialization?: StringNullableListFilter<"CareCompanion">
    zone?: StringFilter<"CareCompanion"> | string
    isAvailable?: BoolFilter<"CareCompanion"> | boolean
    teamId?: StringNullableFilter<"CareCompanion"> | string | null
    createdAt?: DateTimeFilter<"CareCompanion"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    team?: XOR<TeamNullableRelationFilter, TeamWhereInput> | null
  }, "id" | "userId">

  export type CareCompanionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrderInput | SortOrder
    bio?: SortOrder
    specialization?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    teamId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CareCompanionCountOrderByAggregateInput
    _max?: CareCompanionMaxOrderByAggregateInput
    _min?: CareCompanionMinOrderByAggregateInput
  }

  export type CareCompanionScalarWhereWithAggregatesInput = {
    AND?: CareCompanionScalarWhereWithAggregatesInput | CareCompanionScalarWhereWithAggregatesInput[]
    OR?: CareCompanionScalarWhereWithAggregatesInput[]
    NOT?: CareCompanionScalarWhereWithAggregatesInput | CareCompanionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CareCompanion"> | string
    userId?: StringWithAggregatesFilter<"CareCompanion"> | string
    name?: StringWithAggregatesFilter<"CareCompanion"> | string
    photo?: StringNullableWithAggregatesFilter<"CareCompanion"> | string | null
    bio?: StringWithAggregatesFilter<"CareCompanion"> | string
    specialization?: StringNullableListFilter<"CareCompanion">
    zone?: StringWithAggregatesFilter<"CareCompanion"> | string
    isAvailable?: BoolWithAggregatesFilter<"CareCompanion"> | boolean
    teamId?: StringNullableWithAggregatesFilter<"CareCompanion"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CareCompanion"> | Date | string
  }

  export type UserCreateInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
    fieldManagerProfile?: FieldManagerCreateNestedOneWithoutUserInput
    careCompanionProfile?: CareCompanionCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
    fieldManagerProfile?: FieldManagerUncheckedCreateNestedOneWithoutUserInput
    careCompanionProfile?: CareCompanionUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    fieldManagerProfile?: FieldManagerUpdateOneWithoutUserNestedInput
    careCompanionProfile?: CareCompanionUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    fieldManagerProfile?: FieldManagerUncheckedUpdateOneWithoutUserNestedInput
    careCompanionProfile?: CareCompanionUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
  }

  export type ZoneCreateInput = {
    id?: string
    name: string
    city: string
    address: string
    state: string
    pincode: string
    latitude?: number | null
    longitude?: number | null
    phone?: string | null
    leaseStartDate?: Date | string | null
    leaseEndDate?: Date | string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    fieldManagerId?: string | null
  }

  export type ZoneUncheckedCreateInput = {
    id?: string
    name: string
    city: string
    address: string
    state: string
    pincode: string
    latitude?: number | null
    longitude?: number | null
    phone?: string | null
    leaseStartDate?: Date | string | null
    leaseEndDate?: Date | string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    fieldManagerId?: string | null
  }

  export type ZoneUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    pincode?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    leaseStartDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    leaseEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldManagerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ZoneUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    pincode?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    leaseStartDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    leaseEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldManagerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ZoneCreateManyInput = {
    id?: string
    name: string
    city: string
    address: string
    state: string
    pincode: string
    latitude?: number | null
    longitude?: number | null
    phone?: string | null
    leaseStartDate?: Date | string | null
    leaseEndDate?: Date | string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    fieldManagerId?: string | null
  }

  export type ZoneUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    pincode?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    leaseStartDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    leaseEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldManagerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ZoneUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    state?: StringFieldUpdateOperationsInput | string
    pincode?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    leaseStartDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    leaseEndDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldManagerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CallbackRequestCreateInput = {
    id?: string
    name: string
    phone: string
    subscriberId?: string | null
    beneficiaryId?: string | null
    status?: $Enums.CallbackStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CallbackRequestUncheckedCreateInput = {
    id?: string
    name: string
    phone: string
    subscriberId?: string | null
    beneficiaryId?: string | null
    status?: $Enums.CallbackStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CallbackRequestUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    beneficiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCallbackStatusFieldUpdateOperationsInput | $Enums.CallbackStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CallbackRequestUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    beneficiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCallbackStatusFieldUpdateOperationsInput | $Enums.CallbackStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CallbackRequestCreateManyInput = {
    id?: string
    name: string
    phone: string
    subscriberId?: string | null
    beneficiaryId?: string | null
    status?: $Enums.CallbackStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CallbackRequestUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    beneficiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCallbackStatusFieldUpdateOperationsInput | $Enums.CallbackStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CallbackRequestUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    beneficiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCallbackStatusFieldUpdateOperationsInput | $Enums.CallbackStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FieldManagerCreateInput = {
    id?: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutFieldManagerProfileInput
    teams?: TeamCreateNestedManyWithoutFieldManagerInput
  }

  export type FieldManagerUncheckedCreateInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    teams?: TeamUncheckedCreateNestedManyWithoutFieldManagerInput
  }

  export type FieldManagerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFieldManagerProfileNestedInput
    teams?: TeamUpdateManyWithoutFieldManagerNestedInput
  }

  export type FieldManagerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teams?: TeamUncheckedUpdateManyWithoutFieldManagerNestedInput
  }

  export type FieldManagerCreateManyInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
  }

  export type FieldManagerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FieldManagerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamCreateInput = {
    id?: string
    name: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
    fieldManager: FieldManagerCreateNestedOneWithoutTeamsInput
    careCompanions?: CareCompanionCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateInput = {
    id?: string
    name: string
    fieldManagerId: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
    careCompanions?: CareCompanionUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldManager?: FieldManagerUpdateOneRequiredWithoutTeamsNestedInput
    careCompanions?: CareCompanionUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fieldManagerId?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    careCompanions?: CareCompanionUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamCreateManyInput = {
    id?: string
    name: string
    fieldManagerId: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fieldManagerId?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareCompanionCreateInput = {
    id?: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCareCompanionProfileInput
    team?: TeamCreateNestedOneWithoutCareCompanionsInput
  }

  export type CareCompanionUncheckedCreateInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    teamId?: string | null
    createdAt?: Date | string
  }

  export type CareCompanionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCareCompanionProfileNestedInput
    team?: TeamUpdateOneWithoutCareCompanionsNestedInput
  }

  export type CareCompanionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareCompanionCreateManyInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    teamId?: string | null
    createdAt?: Date | string
  }

  export type CareCompanionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareCompanionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type FieldManagerNullableRelationFilter = {
    is?: FieldManagerWhereInput | null
    isNot?: FieldManagerWhereInput | null
  }

  export type CareCompanionNullableRelationFilter = {
    is?: CareCompanionWhereInput | null
    isNot?: CareCompanionWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    role?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    role?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    role?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ZoneCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    city?: SortOrder
    address?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    phone?: SortOrder
    leaseStartDate?: SortOrder
    leaseEndDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    fieldManagerId?: SortOrder
  }

  export type ZoneAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type ZoneMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    city?: SortOrder
    address?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    phone?: SortOrder
    leaseStartDate?: SortOrder
    leaseEndDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    fieldManagerId?: SortOrder
  }

  export type ZoneMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    city?: SortOrder
    address?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    phone?: SortOrder
    leaseStartDate?: SortOrder
    leaseEndDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    fieldManagerId?: SortOrder
  }

  export type ZoneSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumCallbackStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CallbackStatus | EnumCallbackStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCallbackStatusFilter<$PrismaModel> | $Enums.CallbackStatus
  }

  export type CallbackRequestCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    subscriberId?: SortOrder
    beneficiaryId?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CallbackRequestMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    subscriberId?: SortOrder
    beneficiaryId?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CallbackRequestMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    subscriberId?: SortOrder
    beneficiaryId?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumCallbackStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CallbackStatus | EnumCallbackStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCallbackStatusWithAggregatesFilter<$PrismaModel> | $Enums.CallbackStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCallbackStatusFilter<$PrismaModel>
    _max?: NestedEnumCallbackStatusFilter<$PrismaModel>
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type TeamListRelationFilter = {
    every?: TeamWhereInput
    some?: TeamWhereInput
    none?: TeamWhereInput
  }

  export type TeamOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FieldManagerCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    createdAt?: SortOrder
  }

  export type FieldManagerMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    createdAt?: SortOrder
  }

  export type FieldManagerMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    createdAt?: SortOrder
  }

  export type FieldManagerRelationFilter = {
    is?: FieldManagerWhereInput
    isNot?: FieldManagerWhereInput
  }

  export type CareCompanionListRelationFilter = {
    every?: CareCompanionWhereInput
    some?: CareCompanionWhereInput
    none?: CareCompanionWhereInput
  }

  export type CareCompanionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TeamCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    fieldManagerId?: SortOrder
    zone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    fieldManagerId?: SortOrder
    zone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    fieldManagerId?: SortOrder
    zone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type TeamNullableRelationFilter = {
    is?: TeamWhereInput | null
    isNot?: TeamWhereInput | null
  }

  export type CareCompanionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrder
    bio?: SortOrder
    specialization?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    teamId?: SortOrder
    createdAt?: SortOrder
  }

  export type CareCompanionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrder
    bio?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    teamId?: SortOrder
    createdAt?: SortOrder
  }

  export type CareCompanionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    photo?: SortOrder
    bio?: SortOrder
    zone?: SortOrder
    isAvailable?: SortOrder
    teamId?: SortOrder
    createdAt?: SortOrder
  }

  export type FieldManagerCreateNestedOneWithoutUserInput = {
    create?: XOR<FieldManagerCreateWithoutUserInput, FieldManagerUncheckedCreateWithoutUserInput>
    connectOrCreate?: FieldManagerCreateOrConnectWithoutUserInput
    connect?: FieldManagerWhereUniqueInput
  }

  export type CareCompanionCreateNestedOneWithoutUserInput = {
    create?: XOR<CareCompanionCreateWithoutUserInput, CareCompanionUncheckedCreateWithoutUserInput>
    connectOrCreate?: CareCompanionCreateOrConnectWithoutUserInput
    connect?: CareCompanionWhereUniqueInput
  }

  export type FieldManagerUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<FieldManagerCreateWithoutUserInput, FieldManagerUncheckedCreateWithoutUserInput>
    connectOrCreate?: FieldManagerCreateOrConnectWithoutUserInput
    connect?: FieldManagerWhereUniqueInput
  }

  export type CareCompanionUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<CareCompanionCreateWithoutUserInput, CareCompanionUncheckedCreateWithoutUserInput>
    connectOrCreate?: CareCompanionCreateOrConnectWithoutUserInput
    connect?: CareCompanionWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type FieldManagerUpdateOneWithoutUserNestedInput = {
    create?: XOR<FieldManagerCreateWithoutUserInput, FieldManagerUncheckedCreateWithoutUserInput>
    connectOrCreate?: FieldManagerCreateOrConnectWithoutUserInput
    upsert?: FieldManagerUpsertWithoutUserInput
    disconnect?: FieldManagerWhereInput | boolean
    delete?: FieldManagerWhereInput | boolean
    connect?: FieldManagerWhereUniqueInput
    update?: XOR<XOR<FieldManagerUpdateToOneWithWhereWithoutUserInput, FieldManagerUpdateWithoutUserInput>, FieldManagerUncheckedUpdateWithoutUserInput>
  }

  export type CareCompanionUpdateOneWithoutUserNestedInput = {
    create?: XOR<CareCompanionCreateWithoutUserInput, CareCompanionUncheckedCreateWithoutUserInput>
    connectOrCreate?: CareCompanionCreateOrConnectWithoutUserInput
    upsert?: CareCompanionUpsertWithoutUserInput
    disconnect?: CareCompanionWhereInput | boolean
    delete?: CareCompanionWhereInput | boolean
    connect?: CareCompanionWhereUniqueInput
    update?: XOR<XOR<CareCompanionUpdateToOneWithWhereWithoutUserInput, CareCompanionUpdateWithoutUserInput>, CareCompanionUncheckedUpdateWithoutUserInput>
  }

  export type FieldManagerUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<FieldManagerCreateWithoutUserInput, FieldManagerUncheckedCreateWithoutUserInput>
    connectOrCreate?: FieldManagerCreateOrConnectWithoutUserInput
    upsert?: FieldManagerUpsertWithoutUserInput
    disconnect?: FieldManagerWhereInput | boolean
    delete?: FieldManagerWhereInput | boolean
    connect?: FieldManagerWhereUniqueInput
    update?: XOR<XOR<FieldManagerUpdateToOneWithWhereWithoutUserInput, FieldManagerUpdateWithoutUserInput>, FieldManagerUncheckedUpdateWithoutUserInput>
  }

  export type CareCompanionUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<CareCompanionCreateWithoutUserInput, CareCompanionUncheckedCreateWithoutUserInput>
    connectOrCreate?: CareCompanionCreateOrConnectWithoutUserInput
    upsert?: CareCompanionUpsertWithoutUserInput
    disconnect?: CareCompanionWhereInput | boolean
    delete?: CareCompanionWhereInput | boolean
    connect?: CareCompanionWhereUniqueInput
    update?: XOR<XOR<CareCompanionUpdateToOneWithWhereWithoutUserInput, CareCompanionUpdateWithoutUserInput>, CareCompanionUncheckedUpdateWithoutUserInput>
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumCallbackStatusFieldUpdateOperationsInput = {
    set?: $Enums.CallbackStatus
  }

  export type UserCreateNestedOneWithoutFieldManagerProfileInput = {
    create?: XOR<UserCreateWithoutFieldManagerProfileInput, UserUncheckedCreateWithoutFieldManagerProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutFieldManagerProfileInput
    connect?: UserWhereUniqueInput
  }

  export type TeamCreateNestedManyWithoutFieldManagerInput = {
    create?: XOR<TeamCreateWithoutFieldManagerInput, TeamUncheckedCreateWithoutFieldManagerInput> | TeamCreateWithoutFieldManagerInput[] | TeamUncheckedCreateWithoutFieldManagerInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutFieldManagerInput | TeamCreateOrConnectWithoutFieldManagerInput[]
    createMany?: TeamCreateManyFieldManagerInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type TeamUncheckedCreateNestedManyWithoutFieldManagerInput = {
    create?: XOR<TeamCreateWithoutFieldManagerInput, TeamUncheckedCreateWithoutFieldManagerInput> | TeamCreateWithoutFieldManagerInput[] | TeamUncheckedCreateWithoutFieldManagerInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutFieldManagerInput | TeamCreateOrConnectWithoutFieldManagerInput[]
    createMany?: TeamCreateManyFieldManagerInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutFieldManagerProfileNestedInput = {
    create?: XOR<UserCreateWithoutFieldManagerProfileInput, UserUncheckedCreateWithoutFieldManagerProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutFieldManagerProfileInput
    upsert?: UserUpsertWithoutFieldManagerProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutFieldManagerProfileInput, UserUpdateWithoutFieldManagerProfileInput>, UserUncheckedUpdateWithoutFieldManagerProfileInput>
  }

  export type TeamUpdateManyWithoutFieldManagerNestedInput = {
    create?: XOR<TeamCreateWithoutFieldManagerInput, TeamUncheckedCreateWithoutFieldManagerInput> | TeamCreateWithoutFieldManagerInput[] | TeamUncheckedCreateWithoutFieldManagerInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutFieldManagerInput | TeamCreateOrConnectWithoutFieldManagerInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutFieldManagerInput | TeamUpsertWithWhereUniqueWithoutFieldManagerInput[]
    createMany?: TeamCreateManyFieldManagerInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutFieldManagerInput | TeamUpdateWithWhereUniqueWithoutFieldManagerInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutFieldManagerInput | TeamUpdateManyWithWhereWithoutFieldManagerInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type TeamUncheckedUpdateManyWithoutFieldManagerNestedInput = {
    create?: XOR<TeamCreateWithoutFieldManagerInput, TeamUncheckedCreateWithoutFieldManagerInput> | TeamCreateWithoutFieldManagerInput[] | TeamUncheckedCreateWithoutFieldManagerInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutFieldManagerInput | TeamCreateOrConnectWithoutFieldManagerInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutFieldManagerInput | TeamUpsertWithWhereUniqueWithoutFieldManagerInput[]
    createMany?: TeamCreateManyFieldManagerInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutFieldManagerInput | TeamUpdateWithWhereUniqueWithoutFieldManagerInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutFieldManagerInput | TeamUpdateManyWithWhereWithoutFieldManagerInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type FieldManagerCreateNestedOneWithoutTeamsInput = {
    create?: XOR<FieldManagerCreateWithoutTeamsInput, FieldManagerUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: FieldManagerCreateOrConnectWithoutTeamsInput
    connect?: FieldManagerWhereUniqueInput
  }

  export type CareCompanionCreateNestedManyWithoutTeamInput = {
    create?: XOR<CareCompanionCreateWithoutTeamInput, CareCompanionUncheckedCreateWithoutTeamInput> | CareCompanionCreateWithoutTeamInput[] | CareCompanionUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: CareCompanionCreateOrConnectWithoutTeamInput | CareCompanionCreateOrConnectWithoutTeamInput[]
    createMany?: CareCompanionCreateManyTeamInputEnvelope
    connect?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
  }

  export type CareCompanionUncheckedCreateNestedManyWithoutTeamInput = {
    create?: XOR<CareCompanionCreateWithoutTeamInput, CareCompanionUncheckedCreateWithoutTeamInput> | CareCompanionCreateWithoutTeamInput[] | CareCompanionUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: CareCompanionCreateOrConnectWithoutTeamInput | CareCompanionCreateOrConnectWithoutTeamInput[]
    createMany?: CareCompanionCreateManyTeamInputEnvelope
    connect?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
  }

  export type FieldManagerUpdateOneRequiredWithoutTeamsNestedInput = {
    create?: XOR<FieldManagerCreateWithoutTeamsInput, FieldManagerUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: FieldManagerCreateOrConnectWithoutTeamsInput
    upsert?: FieldManagerUpsertWithoutTeamsInput
    connect?: FieldManagerWhereUniqueInput
    update?: XOR<XOR<FieldManagerUpdateToOneWithWhereWithoutTeamsInput, FieldManagerUpdateWithoutTeamsInput>, FieldManagerUncheckedUpdateWithoutTeamsInput>
  }

  export type CareCompanionUpdateManyWithoutTeamNestedInput = {
    create?: XOR<CareCompanionCreateWithoutTeamInput, CareCompanionUncheckedCreateWithoutTeamInput> | CareCompanionCreateWithoutTeamInput[] | CareCompanionUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: CareCompanionCreateOrConnectWithoutTeamInput | CareCompanionCreateOrConnectWithoutTeamInput[]
    upsert?: CareCompanionUpsertWithWhereUniqueWithoutTeamInput | CareCompanionUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: CareCompanionCreateManyTeamInputEnvelope
    set?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    disconnect?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    delete?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    connect?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    update?: CareCompanionUpdateWithWhereUniqueWithoutTeamInput | CareCompanionUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: CareCompanionUpdateManyWithWhereWithoutTeamInput | CareCompanionUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: CareCompanionScalarWhereInput | CareCompanionScalarWhereInput[]
  }

  export type CareCompanionUncheckedUpdateManyWithoutTeamNestedInput = {
    create?: XOR<CareCompanionCreateWithoutTeamInput, CareCompanionUncheckedCreateWithoutTeamInput> | CareCompanionCreateWithoutTeamInput[] | CareCompanionUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: CareCompanionCreateOrConnectWithoutTeamInput | CareCompanionCreateOrConnectWithoutTeamInput[]
    upsert?: CareCompanionUpsertWithWhereUniqueWithoutTeamInput | CareCompanionUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: CareCompanionCreateManyTeamInputEnvelope
    set?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    disconnect?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    delete?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    connect?: CareCompanionWhereUniqueInput | CareCompanionWhereUniqueInput[]
    update?: CareCompanionUpdateWithWhereUniqueWithoutTeamInput | CareCompanionUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: CareCompanionUpdateManyWithWhereWithoutTeamInput | CareCompanionUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: CareCompanionScalarWhereInput | CareCompanionScalarWhereInput[]
  }

  export type CareCompanionCreatespecializationInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutCareCompanionProfileInput = {
    create?: XOR<UserCreateWithoutCareCompanionProfileInput, UserUncheckedCreateWithoutCareCompanionProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutCareCompanionProfileInput
    connect?: UserWhereUniqueInput
  }

  export type TeamCreateNestedOneWithoutCareCompanionsInput = {
    create?: XOR<TeamCreateWithoutCareCompanionsInput, TeamUncheckedCreateWithoutCareCompanionsInput>
    connectOrCreate?: TeamCreateOrConnectWithoutCareCompanionsInput
    connect?: TeamWhereUniqueInput
  }

  export type CareCompanionUpdatespecializationInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneRequiredWithoutCareCompanionProfileNestedInput = {
    create?: XOR<UserCreateWithoutCareCompanionProfileInput, UserUncheckedCreateWithoutCareCompanionProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutCareCompanionProfileInput
    upsert?: UserUpsertWithoutCareCompanionProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCareCompanionProfileInput, UserUpdateWithoutCareCompanionProfileInput>, UserUncheckedUpdateWithoutCareCompanionProfileInput>
  }

  export type TeamUpdateOneWithoutCareCompanionsNestedInput = {
    create?: XOR<TeamCreateWithoutCareCompanionsInput, TeamUncheckedCreateWithoutCareCompanionsInput>
    connectOrCreate?: TeamCreateOrConnectWithoutCareCompanionsInput
    upsert?: TeamUpsertWithoutCareCompanionsInput
    disconnect?: TeamWhereInput | boolean
    delete?: TeamWhereInput | boolean
    connect?: TeamWhereUniqueInput
    update?: XOR<XOR<TeamUpdateToOneWithWhereWithoutCareCompanionsInput, TeamUpdateWithoutCareCompanionsInput>, TeamUncheckedUpdateWithoutCareCompanionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumCallbackStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CallbackStatus | EnumCallbackStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCallbackStatusFilter<$PrismaModel> | $Enums.CallbackStatus
  }

  export type NestedEnumCallbackStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CallbackStatus | EnumCallbackStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CallbackStatus[] | ListEnumCallbackStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCallbackStatusWithAggregatesFilter<$PrismaModel> | $Enums.CallbackStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCallbackStatusFilter<$PrismaModel>
    _max?: NestedEnumCallbackStatusFilter<$PrismaModel>
  }

  export type FieldManagerCreateWithoutUserInput = {
    id?: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    teams?: TeamCreateNestedManyWithoutFieldManagerInput
  }

  export type FieldManagerUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    teams?: TeamUncheckedCreateNestedManyWithoutFieldManagerInput
  }

  export type FieldManagerCreateOrConnectWithoutUserInput = {
    where: FieldManagerWhereUniqueInput
    create: XOR<FieldManagerCreateWithoutUserInput, FieldManagerUncheckedCreateWithoutUserInput>
  }

  export type CareCompanionCreateWithoutUserInput = {
    id?: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    team?: TeamCreateNestedOneWithoutCareCompanionsInput
  }

  export type CareCompanionUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    teamId?: string | null
    createdAt?: Date | string
  }

  export type CareCompanionCreateOrConnectWithoutUserInput = {
    where: CareCompanionWhereUniqueInput
    create: XOR<CareCompanionCreateWithoutUserInput, CareCompanionUncheckedCreateWithoutUserInput>
  }

  export type FieldManagerUpsertWithoutUserInput = {
    update: XOR<FieldManagerUpdateWithoutUserInput, FieldManagerUncheckedUpdateWithoutUserInput>
    create: XOR<FieldManagerCreateWithoutUserInput, FieldManagerUncheckedCreateWithoutUserInput>
    where?: FieldManagerWhereInput
  }

  export type FieldManagerUpdateToOneWithWhereWithoutUserInput = {
    where?: FieldManagerWhereInput
    data: XOR<FieldManagerUpdateWithoutUserInput, FieldManagerUncheckedUpdateWithoutUserInput>
  }

  export type FieldManagerUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teams?: TeamUpdateManyWithoutFieldManagerNestedInput
  }

  export type FieldManagerUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teams?: TeamUncheckedUpdateManyWithoutFieldManagerNestedInput
  }

  export type CareCompanionUpsertWithoutUserInput = {
    update: XOR<CareCompanionUpdateWithoutUserInput, CareCompanionUncheckedUpdateWithoutUserInput>
    create: XOR<CareCompanionCreateWithoutUserInput, CareCompanionUncheckedCreateWithoutUserInput>
    where?: CareCompanionWhereInput
  }

  export type CareCompanionUpdateToOneWithWhereWithoutUserInput = {
    where?: CareCompanionWhereInput
    data: XOR<CareCompanionUpdateWithoutUserInput, CareCompanionUncheckedUpdateWithoutUserInput>
  }

  export type CareCompanionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateOneWithoutCareCompanionsNestedInput
  }

  export type CareCompanionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutFieldManagerProfileInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
    careCompanionProfile?: CareCompanionCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutFieldManagerProfileInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
    careCompanionProfile?: CareCompanionUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutFieldManagerProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutFieldManagerProfileInput, UserUncheckedCreateWithoutFieldManagerProfileInput>
  }

  export type TeamCreateWithoutFieldManagerInput = {
    id?: string
    name: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
    careCompanions?: CareCompanionCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutFieldManagerInput = {
    id?: string
    name: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
    careCompanions?: CareCompanionUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutFieldManagerInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutFieldManagerInput, TeamUncheckedCreateWithoutFieldManagerInput>
  }

  export type TeamCreateManyFieldManagerInputEnvelope = {
    data: TeamCreateManyFieldManagerInput | TeamCreateManyFieldManagerInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutFieldManagerProfileInput = {
    update: XOR<UserUpdateWithoutFieldManagerProfileInput, UserUncheckedUpdateWithoutFieldManagerProfileInput>
    create: XOR<UserCreateWithoutFieldManagerProfileInput, UserUncheckedCreateWithoutFieldManagerProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutFieldManagerProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutFieldManagerProfileInput, UserUncheckedUpdateWithoutFieldManagerProfileInput>
  }

  export type UserUpdateWithoutFieldManagerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    careCompanionProfile?: CareCompanionUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutFieldManagerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    careCompanionProfile?: CareCompanionUncheckedUpdateOneWithoutUserNestedInput
  }

  export type TeamUpsertWithWhereUniqueWithoutFieldManagerInput = {
    where: TeamWhereUniqueInput
    update: XOR<TeamUpdateWithoutFieldManagerInput, TeamUncheckedUpdateWithoutFieldManagerInput>
    create: XOR<TeamCreateWithoutFieldManagerInput, TeamUncheckedCreateWithoutFieldManagerInput>
  }

  export type TeamUpdateWithWhereUniqueWithoutFieldManagerInput = {
    where: TeamWhereUniqueInput
    data: XOR<TeamUpdateWithoutFieldManagerInput, TeamUncheckedUpdateWithoutFieldManagerInput>
  }

  export type TeamUpdateManyWithWhereWithoutFieldManagerInput = {
    where: TeamScalarWhereInput
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyWithoutFieldManagerInput>
  }

  export type TeamScalarWhereInput = {
    AND?: TeamScalarWhereInput | TeamScalarWhereInput[]
    OR?: TeamScalarWhereInput[]
    NOT?: TeamScalarWhereInput | TeamScalarWhereInput[]
    id?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    fieldManagerId?: StringFilter<"Team"> | string
    zone?: StringFilter<"Team"> | string
    createdAt?: DateTimeFilter<"Team"> | Date | string
    updatedAt?: DateTimeFilter<"Team"> | Date | string
  }

  export type FieldManagerCreateWithoutTeamsInput = {
    id?: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutFieldManagerProfileInput
  }

  export type FieldManagerUncheckedCreateWithoutTeamsInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
  }

  export type FieldManagerCreateOrConnectWithoutTeamsInput = {
    where: FieldManagerWhereUniqueInput
    create: XOR<FieldManagerCreateWithoutTeamsInput, FieldManagerUncheckedCreateWithoutTeamsInput>
  }

  export type CareCompanionCreateWithoutTeamInput = {
    id?: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCareCompanionProfileInput
  }

  export type CareCompanionUncheckedCreateWithoutTeamInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
  }

  export type CareCompanionCreateOrConnectWithoutTeamInput = {
    where: CareCompanionWhereUniqueInput
    create: XOR<CareCompanionCreateWithoutTeamInput, CareCompanionUncheckedCreateWithoutTeamInput>
  }

  export type CareCompanionCreateManyTeamInputEnvelope = {
    data: CareCompanionCreateManyTeamInput | CareCompanionCreateManyTeamInput[]
    skipDuplicates?: boolean
  }

  export type FieldManagerUpsertWithoutTeamsInput = {
    update: XOR<FieldManagerUpdateWithoutTeamsInput, FieldManagerUncheckedUpdateWithoutTeamsInput>
    create: XOR<FieldManagerCreateWithoutTeamsInput, FieldManagerUncheckedCreateWithoutTeamsInput>
    where?: FieldManagerWhereInput
  }

  export type FieldManagerUpdateToOneWithWhereWithoutTeamsInput = {
    where?: FieldManagerWhereInput
    data: XOR<FieldManagerUpdateWithoutTeamsInput, FieldManagerUncheckedUpdateWithoutTeamsInput>
  }

  export type FieldManagerUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFieldManagerProfileNestedInput
  }

  export type FieldManagerUncheckedUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareCompanionUpsertWithWhereUniqueWithoutTeamInput = {
    where: CareCompanionWhereUniqueInput
    update: XOR<CareCompanionUpdateWithoutTeamInput, CareCompanionUncheckedUpdateWithoutTeamInput>
    create: XOR<CareCompanionCreateWithoutTeamInput, CareCompanionUncheckedCreateWithoutTeamInput>
  }

  export type CareCompanionUpdateWithWhereUniqueWithoutTeamInput = {
    where: CareCompanionWhereUniqueInput
    data: XOR<CareCompanionUpdateWithoutTeamInput, CareCompanionUncheckedUpdateWithoutTeamInput>
  }

  export type CareCompanionUpdateManyWithWhereWithoutTeamInput = {
    where: CareCompanionScalarWhereInput
    data: XOR<CareCompanionUpdateManyMutationInput, CareCompanionUncheckedUpdateManyWithoutTeamInput>
  }

  export type CareCompanionScalarWhereInput = {
    AND?: CareCompanionScalarWhereInput | CareCompanionScalarWhereInput[]
    OR?: CareCompanionScalarWhereInput[]
    NOT?: CareCompanionScalarWhereInput | CareCompanionScalarWhereInput[]
    id?: StringFilter<"CareCompanion"> | string
    userId?: StringFilter<"CareCompanion"> | string
    name?: StringFilter<"CareCompanion"> | string
    photo?: StringNullableFilter<"CareCompanion"> | string | null
    bio?: StringFilter<"CareCompanion"> | string
    specialization?: StringNullableListFilter<"CareCompanion">
    zone?: StringFilter<"CareCompanion"> | string
    isAvailable?: BoolFilter<"CareCompanion"> | boolean
    teamId?: StringNullableFilter<"CareCompanion"> | string | null
    createdAt?: DateTimeFilter<"CareCompanion"> | Date | string
  }

  export type UserCreateWithoutCareCompanionProfileInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
    fieldManagerProfile?: FieldManagerCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCareCompanionProfileInput = {
    id: string
    name?: string | null
    phone: string
    role?: $Enums.UserRole
    fieldManagerProfile?: FieldManagerUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCareCompanionProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCareCompanionProfileInput, UserUncheckedCreateWithoutCareCompanionProfileInput>
  }

  export type TeamCreateWithoutCareCompanionsInput = {
    id?: string
    name: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
    fieldManager: FieldManagerCreateNestedOneWithoutTeamsInput
  }

  export type TeamUncheckedCreateWithoutCareCompanionsInput = {
    id?: string
    name: string
    fieldManagerId: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamCreateOrConnectWithoutCareCompanionsInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutCareCompanionsInput, TeamUncheckedCreateWithoutCareCompanionsInput>
  }

  export type UserUpsertWithoutCareCompanionProfileInput = {
    update: XOR<UserUpdateWithoutCareCompanionProfileInput, UserUncheckedUpdateWithoutCareCompanionProfileInput>
    create: XOR<UserCreateWithoutCareCompanionProfileInput, UserUncheckedCreateWithoutCareCompanionProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCareCompanionProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCareCompanionProfileInput, UserUncheckedUpdateWithoutCareCompanionProfileInput>
  }

  export type UserUpdateWithoutCareCompanionProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    fieldManagerProfile?: FieldManagerUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCareCompanionProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    fieldManagerProfile?: FieldManagerUncheckedUpdateOneWithoutUserNestedInput
  }

  export type TeamUpsertWithoutCareCompanionsInput = {
    update: XOR<TeamUpdateWithoutCareCompanionsInput, TeamUncheckedUpdateWithoutCareCompanionsInput>
    create: XOR<TeamCreateWithoutCareCompanionsInput, TeamUncheckedCreateWithoutCareCompanionsInput>
    where?: TeamWhereInput
  }

  export type TeamUpdateToOneWithWhereWithoutCareCompanionsInput = {
    where?: TeamWhereInput
    data: XOR<TeamUpdateWithoutCareCompanionsInput, TeamUncheckedUpdateWithoutCareCompanionsInput>
  }

  export type TeamUpdateWithoutCareCompanionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fieldManager?: FieldManagerUpdateOneRequiredWithoutTeamsNestedInput
  }

  export type TeamUncheckedUpdateWithoutCareCompanionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fieldManagerId?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamCreateManyFieldManagerInput = {
    id?: string
    name: string
    zone: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamUpdateWithoutFieldManagerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    careCompanions?: CareCompanionUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutFieldManagerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    careCompanions?: CareCompanionUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateManyWithoutFieldManagerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    zone?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareCompanionCreateManyTeamInput = {
    id?: string
    userId: string
    name: string
    photo?: string | null
    bio?: string
    specialization?: CareCompanionCreatespecializationInput | string[]
    zone: string
    isAvailable?: boolean
    createdAt?: Date | string
  }

  export type CareCompanionUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCareCompanionProfileNestedInput
  }

  export type CareCompanionUncheckedUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareCompanionUncheckedUpdateManyWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    photo?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: StringFieldUpdateOperationsInput | string
    specialization?: CareCompanionUpdatespecializationInput | string[]
    zone?: StringFieldUpdateOperationsInput | string
    isAvailable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use FieldManagerCountOutputTypeDefaultArgs instead
     */
    export type FieldManagerCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FieldManagerCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TeamCountOutputTypeDefaultArgs instead
     */
    export type TeamCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TeamCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ZoneDefaultArgs instead
     */
    export type ZoneArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ZoneDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CallbackRequestDefaultArgs instead
     */
    export type CallbackRequestArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CallbackRequestDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FieldManagerDefaultArgs instead
     */
    export type FieldManagerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FieldManagerDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TeamDefaultArgs instead
     */
    export type TeamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TeamDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CareCompanionDefaultArgs instead
     */
    export type CareCompanionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CareCompanionDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}