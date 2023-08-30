class IndexedDB {
  constructor(dbName, dbVersion, dbUpgrade) {

    return new Promise((resolve, reject) => {
      // объект соединения с базой данных
      this.db = null;
      // обработка ошибки если браузер не поддерживает indexedDb
      if (!('indexedDB' in window)) reject('not supported');
      // открывает базу данных
      const dbOpen = indexedDB.open(dbName, dbVersion);

      if (dbUpgrade) {
        // слушаем событие upgrade
        dbOpen.onupgradeneeded = e => {
          dbUpgrade(dbOpen.result, e.oldVersion, e.newVersion);
        };
      }

      dbOpen.onsuccess = () => {
        this.db = dbOpen.result;
        console.log(this)
        resolve( this );
      };

      dbOpen.onerror = e => {
        reject(`IndexedDB error: ${ e.target.errorCode }`);
      };

    });

  }
  transaction(fn, type, params){
    return new Promise((resolve, reject) => {
      const
        transaction = this.db.transaction(params.storeName, type),
        store = transaction.objectStore(params.storeName),
        request = params.value != null ? store[fn](params.value, params.name) : params.name != null ? store[fn](params.name) : store[fn]();

      request.onsuccess = () => {
        resolve(request.result); // успех
      };

      request.onerror = () => {
        reject(request.error); // ошибка
      };

    });
  }
  // сохраняет элемент
  set(storeName, name, value) {
    return this.transaction('put', 'readwrite', {storeName, name, value})
  }
  get(storeName, name) {
    return this.transaction( 'get', 'readonly', {storeName, name})
  }
  getAll(storeName) {
    return this.transaction( 'getAll', 'readonly', {storeName}) || []
  }
  deleteAll(storeName) {
    return this.transaction('clear', 'readwrite', {storeName})
  }
  openCursor(storeName) {
    return new Promise((resolve, reject) => {
      const
        transaction = this.db.transaction(storeName),
        store = transaction.objectStore(storeName),
        request = store.openCursor();
        let value = null
        let key = null
      request.onsuccess = () => {
        const cursor = request.result
        if(cursor) {
          value = cursor.value
          key = cursor.key
          cursor.continue()
        } else {
          resolve({value, key})
        }
      };
      request.onerror = () => {
        reject(request.error); // ошибка
      };

    });
  }

}

class State {
  static dbName = 'stateDB';
  static dbVersion = 1;
  static storeName = 'state';
  static DB = null;
  static target = new EventTarget();
  constructor(observed, updateCallback) {
    // колбэк изменения состояния
    this.updateCallback = updateCallback;
    // наблюдаемые свойства
    this.observed = new Set(observed);
    // подписка на события set
    State.target.addEventListener('set', e => {
      if (this.updateCallback && this.observed.has( e.detail.name )) {
        this.updateCallback(e.detail.name, e.detail.value);
      }
    });
  }
  async dbConnect() {

    State.DB = State.DB || await new IndexedDB(
      State.dbName,
      State.dbVersion,
      (db, oldVersion, newVersion) => {

        // upgrade database
        switch (oldVersion) {
          case 0: {
            db.createObjectStore( State.storeName );
          }
        }

      });

    return State.DB;

  }

  async set(name, value) {

    // добавляем наблюдаемое свойство
    this.observed.add(name);

    // обновляем базу
    const db = await this.dbConnect();
    await db.set(State.storeName, name, value);

    // отправляем соытие
    const event = new CustomEvent('set', { detail: { name, value } });
    State.target.dispatchEvent(event);

  }
  async get(name) {

    // добавляем наблюдаемое свойство
    this.observed.add(name);

    // получаем значение
    const db = await this.dbConnect();
    return await db.get( State.storeName, name );

  }
  async getAll() {
    const db = await this.dbConnect();
    return await db.getAll(State.storeName)
  }
  async getLastRecord() {
    const db = await this.dbConnect()
    return await db.openCursor(State.storeName)
  }
  async deleteAll() {
    const db = await this.dbConnect()
    return await db.deleteAll(State.storeName)
  }

}
export {
  State
}

