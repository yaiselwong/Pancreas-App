window.indexedDbHelper = (function () {

    const DB_VERSION = 7;
    const DB_NAME = "PancreasDB";

    function log(msg, data) {
        console.log("%c[IndexedDB] " + msg, "color: #2e4d32; font-weight: bold;", data || "");
    }

    function logError(msg, error) {
        console.error("%c[IndexedDB ERROR] " + msg, "color: red; font-weight: bold;", error);
        alert("IndexedDB ERROR: " + msg);
    }

    function openDb() {
        log("Abriendo DB:", DB_NAME);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                log("Actualizando estructura de DB a versión:", DB_VERSION);

                const db = event.target.result;

                try {
                    if (!db.objectStoreNames.contains("Pacientes")) {
                        db.createObjectStore("Pacientes", { keyPath: "Id", autoIncrement: true });
                        log("Store creado:", "Pacientes");
                    }

                    if (!db.objectStoreNames.contains("Registros")) {
                        const store = db.createObjectStore("Registros", { keyPath: "Id", autoIncrement: true });
                        store.createIndex("PacienteId", "PacienteId", { unique: false });
                        log("Store creado:", "Registros");
                    }
                }
                catch (e) {
                    logError("Error creando stores", e);
                }
            };

            request.onsuccess = () => {
                log("DB abierta correctamente");
                resolve(request.result);
            };

            request.onerror = () => {
                logError("Error abriendo DB", request.error);
                reject(request.error);
            };
        });
    }

    async function withDb(mode, storeName, callback) {
        try {
            const db = await openDb();
            const tx = db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);

            log(`Transacción iniciada → Store: ${storeName}, Modo: ${mode}`);

            const result = callback(store);

            tx.oncomplete = () => {
                log(`Transacción completada → Store: ${storeName}`);
                db.close();
            };

            tx.onerror = (e) => {
                logError(`Error en transacción → Store: ${storeName}`, e);
            };

            return result;
        }
        catch (e) {
            logError(`Error general en withDb → Store: ${storeName}`, e);
        }
    }

    return {

        // ---------------- PACIENTES ----------------

        addPaciente: async function (data) {
            log("addPaciente()", data);

            return withDb("readwrite", "Pacientes", (store) => {
                return new Promise((resolve, reject) => {
                    const req = store.add(data);

                    req.onsuccess = () => {
                        log("Paciente agregado correctamente", data);
                        resolve(true);
                    };

                    req.onerror = (e) => {
                        logError("Error agregando paciente", e);
                        reject(e);
                    };
                });
            });
        },

        updatePaciente: async function (data) {
            log("updatePaciente()", data);

            return withDb("readwrite", "Pacientes", (store) => {
                return new Promise((resolve, reject) => {
                    const req = store.put(data);

                    req.onsuccess = () => {
                        log("Paciente actualizado correctamente", data);
                        resolve(true);
                    };

                    req.onerror = (e) => {
                        logError("Error actualizando paciente", e);
                        reject(e);
                    };
                });
            });
        },

        getPacientes: async function () {
            log("getPacientes()");

            return withDb("readonly", "Pacientes", (store) => {
                return new Promise((resolve, reject) => {
                    const req = store.getAll();

                    req.onsuccess = () => {
                        log("Pacientes obtenidos:", req.result);
                        resolve(req.result);
                    };

                    req.onerror = (e) => {
                        logError("Error obteniendo pacientes", e);
                        reject(e);
                    };
                });
            });
        },

        getPaciente: async function (id) {
            log("getPaciente()", id);

            return withDb("readonly", "Pacientes", (store) => {
                return new Promise((resolve, reject) => {
                    const req = store.get(id);

                    req.onsuccess = () => {
                        log("Paciente obtenido:", req.result);
                        resolve(req.result);
                    };

                    req.onerror = (e) => {
                        logError("Error obteniendo paciente", e);
                        reject(e);
                    };
                });
            });
        },

        // ---------------- REGISTROS ----------------

        addRegistro: async function (data) {
            log("addRegistro()", data);

            return withDb("readwrite", "Registros", (store) => {
                return new Promise((resolve, reject) => {
                    const req = store.add(data);

                    req.onsuccess = () => {
                        log("Registro agregado correctamente", data);
                        resolve(true);
                    };

                    req.onerror = (e) => {
                        logError("Error agregando registro", e);
                        reject(e);
                    };
                });
            });
        },

        getRegistrosPaciente: async function (pacienteId) {
            log("getRegistrosPaciente()", pacienteId);

            return withDb("readonly", "Registros", (store) => {
                return new Promise((resolve, reject) => {
                    const index = store.index("PacienteId");
                    const results = [];

                    const cursor = index.openCursor(IDBKeyRange.only(pacienteId));

                    cursor.onsuccess = function (event) {
                        const cur = event.target.result;

                        if (cur) {
                            results.push(cur.value);
                            cur.continue();
                        } else {
                            log("Registros obtenidos:", results);
                            resolve(results);
                        }
                    };

                    cursor.onerror = (e) => {
                        logError("Error obteniendo registros por PacienteId", e);
                        reject(e);
                    };
                });
            });
        },
        getRegistro: async function (id) {
            log("getRegistro()", id);

            return withDb("readonly", "Registros", (store) => {
                return new Promise((resolve, reject) => {

                    const request = store.get(id);

                    request.onsuccess = function (event) {
                        const result = event.target.result;

                        if (result) {
                            log("Registro obtenido:", result);
                            resolve(result);
                        } else {
                            log("Registro no encontrado:", id);
                            resolve(null);
                        }
                    };

                    request.onerror = function (e) {
                        logError("Error obteniendo registro por ID", e);
                        reject(e);
                    };
                });
            });
        }

    };

})();
