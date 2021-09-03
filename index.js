const axios = require('axios')
const express = require('express')
const fs = require('fs')
const { v4: uuid } = require('uuid')
const url = require('url')

const Pokedata = async () => {
    const { data } = await axios.get("https://randomuser.me/api")
    const roommate1 = {
        nombre: `${data.results[0].name.first} ${data.results[0].name.last}`,
        id: uuid().slice(-6),
        email: data.results[0].email,
        debe: 0,
        recibe: 0
    }
    console.log(roommate1)
    return roommate1
}

const actualizarUsuarios = async () => {
    fs.readFile('roommates.json', async (err, data) => {
        if (err) throw err;
        let usuariosJSON = JSON.parse(data);
        fs.readFile('gastos.json', async (err, data) => {
            if (err) console.error(err);
            let gastosJSON = JSON.parse(data);
            usuariosJSON.roommates.forEach((usuario) => {
                usuario.debe = 0;
                gastosJSON.gastos.forEach((gasto) => {
                    if (gasto.roommate == usuario.nombre) {
                        usuario.debe += gasto.monto
                    }
                });
            });
            fs.writeFile('roommates.json', JSON.stringify(usuariosJSON), (err) => {
                if (err) console.error(err);
                return true
            })
        })
    })
};

const registrarUsuario = async (usuario) => {
    fs.readFile('roommates.json', (err, data) => {
        let base = JSON.parse(data);
        base.roommates.push(usuario);
        fs.writeFile('roommates.json', JSON.stringify(base), (err) => {
            if (err) console.error(err);
            return 1
        })
    });
};

const registrarGasto = async (datos) => {
    datos.id = uuid().slice(-6);
    fs.readFile('gastos.json', (err, data) => {
        if (err) throw err;
        let base = JSON.parse(data);
        base.gastos.push(datos);
        fs.writeFile('gastos.json', JSON.stringify(base), (err) => {
            if (err) console.error(err);
            actualizarUsuarios()
                .then(() => {
                    return true
                })
        })
    });
};


const modificarGasto = async(datos) => {
    fs.readFile('gastos.json',(err,data) => {
        if (err) console.error(err);
        let base = JSON.parse(data);
        let index = base.gastos.findIndex((gasto) => gasto.id == datos.id);
        base.gastos[index] = datos;
        fs.writeFile('gastos.json',JSON.stringify(base),(err) => {
            if (err) console.error(err);
            actualizarUsuarios()
            .then(()=>{
                return true
            })
        })
    });
};

const eliminarGasto = async(id) => {
    fs.readFile('gastos.json', (err,data) => {
        let base = JSON.parse(data);
        let index = base.gastos.findIndex((gasto) => gasto.id == id);
        base.gastos.splice(index,1);
        fs.writeFile('gastos.json',JSON.stringify(base),(err)=>{
            if (err) console.error(err);
            actualizarUsuarios()
            .then(()=>{
                return true
            })
        })
    })
};

const app = express();

app.get('/', (req, res) => {
    fs.readFile('index.html', 'utf-8', (err, data) => {
        if (err) { console.log(err) }
        res.writeHead(200, { 'Content-type': 'text/html; charset=utf-8' })
        res.end(data)
    })
})

app.get('/roommate*', (req, res) => {
    fs.readFile('roommates.json', (err, data) => {
        if (err) console.error(err);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
    })
})

app.post('/roommate*', (req, res) => {
    Pokedata()
        .then(async (usuario) => {
            console.log(usuario)
            registrarUsuario(usuario);
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(usuario));
        })
})

app.get('/gastos', (req, res) => {
    fs.readFile('gastos.json', 'utf-8', (err, data) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
    });
})

app.post('/gasto', (req, res) => {
    let requestBody = '';
    req.on('data', (chunk) => {
        requestBody += chunk.toString()
    });
    req.on('end', async () => {
        const parsedData = JSON.parse(requestBody);
        await registrarGasto(parsedData)
            .then(async () => {
                res.writeHead(200);
                res.end()
            })
    })
})

app.put('/gasto', (req, res) => {
    const query = url.parse(req.url,true).query;
    let requestBody = '';
    req.on('data', (chunk) => {
        requestBody += chunk.toString()
    });
    req.on('end', async () => {
        let parsedData = JSON.parse(requestBody);
        parsedData.id = query.id;
        await modificarGasto(parsedData).then(() => {
            res.writeHead(201);
            res.end();
        })
    });
})

app.delete('/gasto', (req, res) => {
    const query = url.parse(req.url,true).query;
    eliminarGasto(query.id)
    .then(() => {
        res.writeHead(201);
        res.end()
    })
})

app.listen(3000, () => console.log('server ok'))
console.log('http://localhost:3000/');