const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const express = require('express')
var bodyParser = require('body-parser')
const apifunction = require('./api')
const dbconfig = require('./db')
const AdminJSSequelize = require('@adminjs/sequelize')
const { Sequelize } = require('sequelize')
const checklogin = require('./checklogin')
var os = require('os');
var nodeDiskInfo = require('node-disk-info');
const date = require('date-and-time')
var crypto = require('crypto');
const path = require('path')
require('express-group-routes');
const appurl = require('./config.js')

AdminJS.registerAdapter(AdminJSSequelize)

const sequelize = new Sequelize(dbconfig.dbname, dbconfig.dbuser, dbconfig.dbpassword, {
    host: dbconfig.dbhost,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.nas = require('./models/nas')(sequelize, Sequelize);
db.radcheck = require('./models/radcheck')(sequelize, Sequelize);
db.radacct = require('./models/radacct')(sequelize, Sequelize);
db.apikey = require('./models/apikey')(sequelize, Sequelize);
db.serverlist = require('./models/serverlist')(sequelize, Sequelize);
db.servercert = require('./models/servercert')(sequelize, Sequelize);
db.servergroup = require('./models/server_group')(sequelize, Sequelize);
db.adminusers = require('./models/adminuser')(sequelize, Sequelize);
db.logs = require('./models/logs')(sequelize, Sequelize);
db.serverlist.belongsTo(db.servergroup, { foreignKey: 'server_group_id', as: 'servergroup' });
db.servergroup.hasMany(db.serverlist, { foreignKey: 'server_group_id', as: 'serverlist' });
db.sequelize.sync()
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });
module.exports = db;

const PORT = 3000

// const DEFAULT_ADMIN = {
//     email: 'admin@smarterspanel.com',
//     password: 'password',
// }

const authenticate = async (email, password) => {
    var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
    var key = 'smartervpnpanel'
    var cipher = crypto.createCipher(algorithm, key);
    var encrypted = cipher.update(password, 'utf8', 'hex') + cipher.final('hex');
    var userdata = await db.adminusers.findOne({ where: { username: email, password: encrypted } }).then((data) => {
        // console.log("data", data)
        if (data) {
            return Promise.resolve({
                email: email,
                password: password,
            })
        }
    });
    if (userdata != undefined) {
        return Promise.resolve({
            email: email,
            password: password,
        })
    }
    // if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    //     return Promise.resolve(DEFAULT_ADMIN)
    // }
    return null
}
console.log("authenticate", authenticate);
const start = async () => {
    const nets = os.networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object
    const selectedid = 5;
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    const app = express()
    console.log(path.join(__dirname, "public"))
    app.enable('trust proxy');
    app.use(express.static(path.join(__dirname, "public")));
    const options = {
        resources: [
            {
                resource: db.radcheck,
                options: {
                    id: 'users',
                    parent: {
                        name: 'Manage FreeRADIUS',
                        icon: 'User'
                    },
                    listProperties: ['id', 'username', 'attribute', 'value'],
                    actions: {
                        show: {
                            layout: [

                                [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['username', { width: '50%' }],
                                        ['attribute', { width: '50%' }],
                                    ],
                                ],
                                [
                                    { flexDirection: 'row', flex: true }, [
                                        ['value', { width: '50%' }],
                                        ['id', { width: '50%' }],
                                    ],
                                ],
                            ]
                        },
                    },
                    properties: {
                        username: {
                            description: 'Leave it empty for auto-generate',
                        },
                        op: {
                            isVisible: { edit: false, list: false, show: false, filter: false },
                        },
                        value: {
                            type: 'password',
                            description: 'Leave it empty for auto-generate',
                        },
                        attribute: {
                            type: 'dropdown',
                            selectInput: { value: 'Cleartext-Password', label: 'Cleartext-Password' },
                            availableValues: [
                                { value: 'Cleartext-Password', selected: true, label: 'Cleartext-Password' },
                                { value: 'User-Password', label: 'User-Password' },
                                { value: 'Crypt-Password', label: 'Crypt-Password' },
                                { value: 'MD5-Password', label: 'MD5-Password' },
                                { value: 'SHA1-Password', label: 'SHA1-Password' },
                                { value: 'CHAP-Password', label: 'CHAP-Password' }
                            ]
                        },
                    },
                },
            },
            {
                resource: db.radacct,
                options: {
                    id: 'onlineUsers',
                    parent: {
                        name: 'Manage FreeRADIUS',
                        icon: 'User',
                        navigation: {
                            name: 'Online User',
                            icon: 'Key',
                        },
                    },
                    listProperties: ['radacctid', 'username', 'nasipaddress', 'acctstarttime', 'acctstoptime'],
                    actions: {
                        list: {
                            after: async (originalResponse, request, context) => {
                                // //
                                // let newdata = [];
                                // originalResponse.records.forEach((element) => {
                                //     if(element.acctstoptime == null){
                                //         newdata.push(element);
                                //     }
                                // });
                                // originalResponse.records = newdata;
                                return originalResponse;
                            }

                        },
                        new: {
                            isVisible: false
                        },

                    },
                }
            },
            {
                resource: db.nas,
                options: {
                    parent: {
                        name: 'Manage FreeRADIUS',
                        icon: 'User'
                    },
                    id: 'nas',
                    listProperties: ['id', 'nasname', 'shortname', 'type', 'secret', 'description'],
                    properties: {
                        nasname: {
                            isRequired: true,
                        },
                        shortname: {
                            isRequired: true,
                        },
                        description: {
                            type: 'textarea',
                            props: {
                                rows: 5,
                            },
                        },
                        secret: {
                            type: 'password',
                            isRequired: true
                        },
                        ports: {
                            type: 'number',

                            actions: {
                                new: {
                                    before: async (request) => {
                                        if (request.payload.record.params.ports == '') {
                                            request.payload.record.params.ports = 0;
                                        }
                                        if (request.payload.record.params.description.lenth > 200) {
                                            request.payload.record.params.description = request.payload.record.params.description.substring(0, 200);
                                        }
                                        return request
                                    },
                                },
                            }
                        },
                        type: {
                            type: 'dropdown',
                            selectInput: 'other',
                            defaultValue: { value: 'other', label: 'Other' },
                            availableValues: [
                                { value: 'other', label: 'Other' },
                                { value: 'cisco', label: 'Cisco' },
                                { value: 'livingston', label: 'Livingston' },
                                { value: 'portslave', label: 'Portslave' },
                                { value: 'computon', label: 'Computon' },
                                { value: 'max40xx', label: 'Max 40xx' },
                                { value: 'multitech', label: 'Multitech' },
                                { value: 'natserver', label: 'Natserver' },
                                { value: 'pathras', label: 'Pathras' },
                                { value: 'patton', label: 'Patton' },
                                { value: 'tc', label: 'tc' },
                                { value: 'usrhiper', label: 'usrhiper' },
                            ],

                        },

                    },
                    actions:
                    {
                        show: {
                            layout: [

                                [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['nasname', { width: '50%' }],
                                        ['shortname', { width: '50%' }],
                                    ],
                                ],
                                [
                                    { flexDirection: 'row', flex: true }, [
                                        ['type', { width: '50%' }],
                                        ['ports', { width: '50%' }],
                                    ],
                                ],
                                [
                                    { flexDirection: 'row', flex: true }, [
                                        ['secret', { width: '50%' }],
                                        ['server', { width: '50%' }],
                                    ],
                                ], [
                                    { flexDirection: 'row', flex: true }, [
                                        ['description', { width: '50%' }],
                                        ['community', { width: '50%' }],
                                    ],
                                ]
                            ]
                        },
                        new: {
                            layout: [
                                ['@Header', { children: 'NAS Info' }],
                                [
                                    { flexDirection: 'row', flex: true },
                                    [

                                        ['nasname', { width: '50%' }],
                                        ['shortname', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['type', { width: '50%', autofill: 'other' }],
                                        ['secret', { width: '50%' }],
                                    ]
                                ],
                                ['@Header', { children: 'NAS Advance' }],
                                [
                                    { flexDirection: 'row', flex: true },
                                    [

                                        ['ports', { width: '33%' }],
                                        ['community', { width: '33%' }],
                                        ['server', { width: '34%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['description', { width: '100%' }],
                                    ]
                                ],
                            ],
                        },

                        edit: {
                            layout: [
                                ['@Header', { children: 'NAS Info' }],
                                [
                                    { flexDirection: 'row', flex: true },
                                    [

                                        ['nasname', { width: '50%' }],
                                        ['shortname', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['type', { width: '50%', autofill: 'other' }],
                                        ['secret', { width: '50%' }],
                                    ]
                                ],
                                ['@Header', { children: 'NAS Advance' }],
                                [
                                    { flexDirection: 'row', flex: true },
                                    [

                                        ['ports', { width: '33%' }],
                                        ['community', { width: '33%' }],
                                        ['server', { width: '34%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['description', { width: '100%' }],
                                    ]
                                ],
                            ],

                        }
                    },
                }
            },
            {
                resource: db.apikey,
                options: {
                    id: 'apikeys',
                    parent: {
                        name: 'Manage FreeRADIUS',
                        icon: 'User',
                        navigation: {
                            name: 'API Keys',
                            icon: 'Key',
                        },
                    },
                    listProperties: ['id', 'apikey', 'description', 'status'],
                    properties: {
                        apikey: {
                            isVisible: { edit: false, list: true, show: true, filter: true },
                        },
                        description: {
                            type: 'textarea',
                            label: 'Description',
                            props: {
                                rows: 5,
                            },
                        },
                        status: {
                            isRequired: true,
                            defaultValue: { value: 'Active', label: 'Active' },
                            availableValues: [
                                { value: 'Active', label: 'Active' },
                                { value: 'InActive', label: 'InActive' }
                            ]
                        },
                    }
                },
            },
            {
                resource: db.logs,
                options: {
                    id: 'logs',
                    parent: {
                        name: 'Manage FreeRADIUS',
                        icon: 'User',
                    },
                    sort: {
                        sortBy: 'id',
                        direction: 'desc',
                    },
                }
            },
            {
                resource: db.servergroup,
                options: {
                    id: 'server_group',
                    parent: {
                        name: 'Manage VPN',
                        icon: 'User'
                    }
                }
            },
            {
                resource: db.serverlist,
                options: {
                    id: 'serverlist',
                    listProperties: ['id', 'server_name', 'server_group_id', 'server_ip', 'sshport', 'server_port', 'service_status', 'status',],
                    parent: {
                        name: 'Manage VPN',
                        icon: 'User',
                        navigation: {
                            name: 'Server List',
                            icon: 'Server',
                        },
                    },
                    actions: {
                        list: {
                            after: (records) => {
                                records.records.forEach((record) => {
                                    // if (record.params.status == 'Active') {
                                    //     record.params.status = '<Label color="green" horizontal>' + record.params.status + '</Label>'
                                    // } else {
                                    //     record.params.status = '<Label color="red" horizontal>' + record.params.status + '</Label>'
                                    // }
                                });
                                return records;
                            }
                        },
                        show: {
                            layout: [
                                ['@Header', { children: 'Server Info' }],
                                [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['server_name', { width: '50%' }],
                                        ['server_group_id', { width: '50%' }],

                                    ],
                                ],
                                [
                                    { flexDirection: 'row', flex: true }, [
                                        ['server_ip', { width: '50%' }],
                                        ['sshport', { width: '50%' }],

                                    ],
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['sshpass', { width: '50%' }],
                                        ['service_status', { width: '50%' }],

                                    ],
                                ], [
                                    { flexDirection: 'row', flex: true }, [
                                        ['server_category', { width: '50%' }],
                                        ['dns', { width: '50%', }],

                                    ],
                                ], [
                                    { flexDirection: 'row', flex: true }, [
                                        ['protocol', { width: '50%' }],
                                        ['server_port', { width: '50%' }],
                                    ],
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['pskkey', { width: '50%', }],

                                        ['dns', { width: '50%' }],
                                    ],
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    ['dns1', { width: '50%' }],
                                    ['dns2', { width: '50%' }],
                                ], [

                                    { flexDirection: 'row', flex: true },

                                    ['dns2', { width: '50%' }],
                                    ['customport', { width: '50%', }],

                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['enableProxy', { width: '50%' }],
                                        ['proxyserver', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['proxyport', { width: '50%' }],
                                        ['proxyretry', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['logging', { width: '50%' }],
                                        ['port', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['customheaderenb1', { width: '50%' }],
                                        ['customheader', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['customheaderenb2', { width: '50%' }],
                                        ['customheader2', { width: '50%' }],
                                    ]
                                ], [
                                    { flexDirection: 'row', flex: true },
                                    [
                                        ['createdAt', { width: '50%', }],
                                        ['updatedAt', { width: '50%' }],
                                    ]
                                ]
                            ]
                        },
                        'RestartServices': {
                            icon: 'Restart',
                            actionType: 'record',
                            isVisible: (context) => {
                                const { record, currentAdmin } = context
                                return record?.params?.status != 'Draft' && record?.params?.status != 'Processing'
                            },
                            handler: async (request, response, context) => {
                                var reloaded = false
                                const { record, currentAdmin } = context
                                var commanddata = {
                                    body: {
                                        id: request.params.recordId,
                                    },
                                };
                                restartdata = await apifunction.restartvpnserver(commanddata, response, db);
                                if (restartdata) {
                                    console.log("restartdata", restartdata)
                                    return {
                                        redirectUrl: '/admin/resources/serverlist/records',
                                        record: record.toJSON(currentAdmin),
                                        notice: {
                                            type: restartdata.status,
                                            message: restartdata.message,
                                        },
                                    }
                                }

                            },
                            component: false,
                            guard: 'areYouSureWantToRestart',
                        },
                        'Reboot': {
                            icon: 'Power',
                            actionType: 'record',
                            isVisible: (context) => {
                                const { record, currentAdmin } = context
                                return record?.params?.status != 'Draft' && record?.params?.status != 'Processing'
                                // return record?.params?.status == 'Online'
                            },
                            handler: async (request, response, context) => {
                                const { record, currentAdmin } = context
                                var reloaded = false;
                                let apikey = await db.apikey.findOne({ order: [['id', 'DESC']], });
                                var commanddata = {
                                    body: {
                                        id: request.params.recordId,
                                    },
                                };
                                rebootdata = await apifunction.rebootvpnserver(commanddata, response, db);
                                if (rebootdata) {
                                    console.log("rebootdata", rebootdata)
                                    return {
                                        redirectUrl: '/admin/resources/serverlist/records',
                                        record: record.toJSON(currentAdmin),
                                        notice: {
                                            type: rebootdata.status,
                                            message: rebootdata.message,
                                        },
                                    }
                                }
                            },
                            component: false,
                            guard: 'areYouSureWantToRestart',
                        },
                        'installationLog': {
                            icon: 'Catalog',
                            actionType: 'record',
                            isVisible: (context) => {
                                const { record, currentAdmin } = context
                                return record?.params?.status != 'Draft' && record?.params?.status != 'Processing'
                            },
                            component: AdminJS.bundle('./components/installLogs'),
                            handler: async (request, response, context) => {
                                console.log("installationLog")
                                var reload = false
                                const { record, currentAdmin } = context
                                let commanddata = {
                                    logintype: record.params.logintype,
                                    server_ip: record.params.server_ip,
                                    sshport: record.params.sshport,
                                    sshpass: record.params.sshpass,
                                }
                                var installdata = ""
                                installdata = await apifunction.getInstallationLog(commanddata)
                                console.log("installdata", installdata)
                                record.params.logdata = installdata;
                                return {
                                    record: record.toJSON(currentAdmin),
                                }
                            }
                        },
                        'installOrReinstallVPN': {
                            icon: 'Renew',
                            actionType: 'record',
                            isVisible: (context) => {
                                // const { record, currentAdmin } = context
                                return true
                                // return record?.params?.status == 'Draft' || record?.params?.status == 'Processing' || record?.params?.status == 'Error' || (record?.params?.status == 'Online')
                            },
                            component: AdminJS.bundle('./components/installVPNServer'),
                            handler: async (request, response, context) => {
                                var reloaded = false
                                request.rawHeaders.map((item, index) => {
                                    if (item.includes('installOrReinstallVPN')) {
                                        var referer = request.rawHeaders[index]
                                        if (referer.split('arg=').length > 1) {
                                            reloaded = true
                                        }
                                    }
                                });
                                var ip = require("ip");
                                const { record, currentAdmin } = context
                                if (request.method == 'post' && request.payload.actionName == 'installationlog') {
                                    let commanddata = {
                                        logintype: record.params.logintype,
                                        server_ip: record.params.server_ip,
                                        sshport: record.params.sshport,
                                        sshpass: record.params.sshpass,
                                    }
                                    var installdata = ""
                                    installdata = await apifunction.getInstallationLog(commanddata)
                                    console.log(installdata)
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        message: 'Installation log',
                                        logdata: installdata,
                                    }
                                } else if (request.method == 'post' && request.payload.actionName == 'checkinstallation') {
                                    const getstatus = await db.sequelize.query("SELECT status FROM server_list WHERE id = " + record.params.id, { type: db.sequelize.QueryTypes.SELECT })
                                    $status = '';
                                    if (getstatus[0].status == 'Online') {
                                        $status = 'Online'
                                    } else if (getstatus[0].status == 'Error') {
                                        $status = 'Error'
                                    } else {
                                        $status = 'Processing'
                                    }
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        message: $status,
                                    }
                                } else {
                                    let apikey = await db.apikey.findOne({ order: [['id', 'DESC']], })
                                    // console.log(apikey.apikey)
                                    let commanddata = {
                                        apikey: apikey.apikey,
                                        id: record.params.id,
                                        logintype: record.params.logintype,
                                        server_ip: record.params.server_ip,
                                        sshport: record.params.sshport,
                                        sshpass: record.params.sshpass,
                                        dns: record.params.dns == '' ? record.params.dns1 + " " + record.params.dns2 : record.params.dns,
                                        protocol: record.params.protocol,
                                        server_category: record.params.server_category, //vpn type
                                        server_port: record.params.server_port,
                                        pskkey: record.params.pskkey == "" ? apifunction.randompskkey(10) : record.params.pskkey,
                                        radius_ip: ip.address(),
                                        ipv6: record.params.ipv6,
                                        loggin: record.params.logging,
                                        panelurl: 'http://' + request.rawHeaders[1],
                                        email: 'admin@smarterspanel.com',
                                    }
                                    console.log(commanddata)
                                    var installdata = ""
                                    console.log("reloaded", reloaded)
                                    if (reloaded == false) {
                                        db.sequelize.query("UPDATE server_list SET status = 'Processing' WHERE id = " + record.params.id, { type: db.sequelize.QueryTypes.UPDATE })
                                        record.params.status = 'Processing'
                                        var connectiontest = await apifunction.testConnection(commanddata, db);
                                        if (connectiontest.includes('connected')) {
                                            installdata = apifunction.installvpnserver(commanddata, '', '', db)
                                            console.log("installdata", installdata)
                                        } else {
                                            record.params.logdata = connectiontest
                                            db.sequelize.query("UPDATE server_list SET status = 'Error' WHERE id = " + record.params.id, { type: db.sequelize.QueryTypes.UPDATE })
                                            record.params.status = 'Error'
                                        }
                                    }
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        msg: 'Server is re-installing'
                                    }
                                }
                            },
                            guard: 'areYouSureWantToReinstall?',
                        },
                        reinstallVPNServer: {
                            actionType: 'record',
                            isVisible: (context) => {
                                const { record, currentAdmin } = context
                                // return (record?.params?.status != 'Draft' && record?.params?.status == 'Reinstalling') || record?.params?.status == 'Completed'
                                return false
                            },
                            component: AdminJS.bundle('./components/reinstallVPNServer'),
                            handler: async (request, response, context) => {
                                var reloaded = false
                                request.rawHeaders.map((item, index) => {
                                    if (item.includes('reinstallVPNServer')) {
                                        var referer = request.rawHeaders[index]
                                        if (referer.split('arg=').length > 1) {
                                            reloaded = true
                                        }
                                    }
                                });
                                var ip = require("ip");
                                const { record, currentAdmin } = context
                                if (request.method == 'post' && request.payload.actionName == 'installationlog') {
                                    let commanddata = {
                                        logintype: record.params.logintype,
                                        server_ip: record.params.server_ip,
                                        sshport: record.params.sshport,
                                        sshpass: record.params.sshpass,
                                    }
                                    var installdata = ""
                                    installdata = await apifunction.getInstallationLog(commanddata)
                                    console.log(installdata)
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        message: 'Installation log',
                                        logdata: installdata,
                                    }
                                } else if (request.method == 'post' && request.payload.actionName == 'checkinstallation') {
                                    const getstatus = await db.sequelize.query("SELECT status FROM server_list WHERE id = " + record.params.id, { type: db.sequelize.QueryTypes.SELECT })
                                    $status = '';
                                    if (getstatus[0].status == 'Online') {
                                        $status = 'Online'
                                    } else if (getstatus[0].status == 'Error') {
                                        $status = 'Error'
                                    } else {
                                        $status = 'Reinstalling'
                                    }
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        message: $status,
                                    }
                                } else {
                                    let apikey = await db.apikey.findOne({ order: [['id', 'DESC']], })
                                    // console.log(apikey.apikey)
                                    let commanddata = {
                                        apikey: apikey.apikey,
                                        id: record.params.id,
                                        logintype: record.params.logintype,
                                        server_ip: record.params.server_ip,
                                        sshport: record.params.sshport,
                                        sshpass: record.params.sshpass,
                                        dns: record.params.dns == '' ? record.params.dns1 + " " + record.params.dns2 : record.params.dns,
                                        protocol: record.params.protocol,
                                        server_category: record.params.server_category, //vpn type
                                        server_port: record.params.server_port,
                                        pskkey: record.params.pskkey == "" ? apifunction.randompskkey(10) : record.params.pskkey,
                                        radius_ip: ip.address(),
                                        ipv6: record.params.ipv6,
                                        loggin: record.params.logging,
                                        panelurl: 'http://' + request.rawHeaders[1],
                                        email: 'admin@smarterspanel.com',
                                    }
                                    console.log(commanddata)
                                    var installdata = ""
                                    console.log("reloaded", reloaded)
                                    if (reloaded == false) {
                                        db.sequelize.query("UPDATE server_list SET status = 'Reinstalling' WHERE id = " + record.params.id, { type: db.sequelize.QueryTypes.UPDATE })
                                        record.params.status = 'Reinstalling'
                                        var connectiontest = await apifunction.testConnection(commanddata, db);
                                        if (connectiontest.includes('connected')) {
                                            installdata = apifunction.installvpnserver(commanddata, '', '', db)
                                            console.log("installdata", installdata)
                                        } else {
                                            record.params.logdata = connectiontest
                                            db.sequelize.query("UPDATE server_list SET status = 'Error' WHERE id = " + record.params.id, { type: db.sequelize.QueryTypes.UPDATE })
                                            record.params.status = 'Error'
                                        }
                                    }
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        msg: 'Server is re-installing'
                                    }
                                }
                            },
                            guard: 'areYouSureWantToReinstall?',
                        },
                        new: {
                            handler: async (request, response, context) => {
                                const { currentAdmin } = context
                                if (request.method === 'post') {
                                    const { payload } = request
                                    payload.customheaderenb1 == undefined ? payload.customheaderenb1 = 'no' : payload.customheaderenb1
                                    payload.customheaderenb2 == undefined ? payload.customheaderenb2 = 'no' : payload.customheaderenb2
                                    const record = await db.serverlist.create(payload)
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        success: true,
                                        redirectUrl: '/admin/resources/serverlist/records',
                                    }
                                }
                                return {
                                    record: db.serverlist.build(),
                                    groups: await db.servergroup.findAll()
                                }
                            },
                            component: AdminJS.bundle('./components/serveradd'),
                        },
                        show: {
                            handler: async (request, response, context) => {
                                const { record, currentAdmin } = context
                                var dnslabel = 'Cloudflare (Anycast: worldwide)'
                                if (record?.params.dns == '1') {
                                    dnslabel = 'Current system resolvers (from /etc/resolv.conf)'
                                } else if (record?.params.dns == '2') {
                                    dnslabel = 'Self-hosted DNS Resolver (Unbound)'
                                } else if (record?.params.dns == '3') {
                                    dnslabel = 'Cloudflare (Anycast: worldwide)'
                                } else if (record?.params.dns == '4') {
                                    dnslabel = 'Quad9 (Anycast: worldwide)'
                                } else if (record?.params.dns == '5') {
                                    dnslabel = 'Quad9 uncensored (Anycast: worldwide)'
                                } else if (record?.params.dns == '6') {
                                    dnslabel = 'FDN (France)'
                                } else if (record?.params.dns == '7') {
                                    dnslabel = 'DNS.WATCH (Germany)'
                                } else if (record?.params.dns == '8') {
                                    dnslabel = 'OpenDNS (Anycast: worldwide)'
                                } else if (record?.params.dns == '9') {
                                    dnslabel = 'Google (Anycast: worldwide)'
                                } else if (record?.params.dns == '10') {
                                    dnslabel = 'Yandex Basic (Russia)'
                                } else if (record?.params.dns == '11') {
                                    dnslabel = 'AdGuard DNS (Anycast: worldwide)'
                                } else if (record?.params.dns == '12') {
                                    dnslabel = 'NextDNS (Anycast: worldwide)'
                                } else if (record?.params.dns == '13') {
                                    dnslabel = 'Custom'
                                }
                                record.params.dns = dnslabel;
                                return {
                                    record: record.toJSON(currentAdmin),
                                    groups: await db.servergroup.findAll()
                                }
                            },
                            component: AdminJS.bundle('./components/serverlistview'),
                        },
                        edit: {
                            handler: async (request, response, context) => {
                                const { record, currentAdmin } = context
                                if (request.method === 'post') {
                                    const { payload } = request
                                    payload.customheader == undefined ? payload.customheader = '' : payload.customheader
                                    payload.customheader2 == undefined ? payload.customheader2 = '' : payload.customheader2
                                    payload.proxyretry == undefined ? payload.proxyretry = 'no' : payload.proxyretry
                                    payload.logging == undefined ? payload.logging = 0 : payload.logging
                                    payload.ipv6 == undefined ? payload.ipv6 = 'n' : payload.ipv6
                                    payload.enableProxy == undefined ? payload.enableProxy = 'no' : payload.enableProxy
                                    payload.customheaderenb1 == undefined ? payload.customheaderenb1 = 'no' : payload.customheaderenb1
                                    payload.customheaderenb2 == undefined ? payload.customheaderenb2 = 'no' : payload.customheaderenb2
                                    if (payload.customheaderenb1 == 'no') {
                                        payload.customheader = ''
                                    }
                                    if (payload.customheaderenb2 == 'no') {
                                        payload.customheader2 = ''
                                    }
                                    // payload.enableProxy =
                                    await record.update(payload)
                                    return {
                                        record: record.toJSON(currentAdmin),
                                        success: true,
                                        redirectUrl: '/admin/resources/serverlist/records',
                                    }
                                }
                                var dnslabel = 'Cloudflare (Anycast: worldwide)'
                                if (record?.params.dns == '1') {
                                    dnslabel = 'Current system resolvers (from /etc/resolv.conf)'
                                } else if (record?.params.dns == '2') {
                                    dnslabel = 'Self-hosted DNS Resolver (Unbound)'
                                } else if (record?.params.dns == '3') {
                                    dnslabel = 'Cloudflare (Anycast: worldwide)'
                                } else if (record?.params.dns == '4') {
                                    dnslabel = 'Quad9 (Anycast: worldwide)'
                                } else if (record?.params.dns == '5') {
                                    dnslabel = 'Quad9 uncensored (Anycast: worldwide)'
                                } else if (record?.params.dns == '6') {
                                    dnslabel = 'FDN (France)'
                                } else if (record?.params.dns == '7') {
                                    dnslabel = 'DNS.WATCH (Germany)'
                                } else if (record?.params.dns == '8') {
                                    dnslabel = 'OpenDNS (Anycast: worldwide)'
                                } else if (record?.params.dns == '9') {
                                    dnslabel = 'Google (Anycast: worldwide)'
                                } else if (record?.params.dns == '10') {
                                    dnslabel = 'Yandex Basic (Russia)'
                                } else if (record?.params.dns == '11') {
                                    dnslabel = 'AdGuard DNS (Anycast: worldwide)'
                                } else if (record?.params.dns == '12') {
                                    dnslabel = 'NextDNS (Anycast: worldwide)'
                                } else if (record?.params.dns == '13') {
                                    dnslabel = 'Custom'
                                }
                                record.params.dnslabel = dnslabel
                                record.params.groups = await db.servergroup.findAll()
                                return {
                                    record: record.toJSON(currentAdmin),
                                    groups: await db.servergroup.findAll()
                                }
                            },
                            component: AdminJS.bundle('./components/serveredit'),
                        }
                    },
                }
            },
            {
                resource: db.adminusers,
                options: {
                    id: 'ChangePassword',
                    parent: {
                        name: 'My Profile',
                        icon: 'User'
                    },
                    actions: {
                        new: {
                            isVisible: false,
                        },
                        show: {
                            isVisible: false,
                        },
                        delete: {
                            isVisible: false,
                        },
                    },
                    properties: {
                        password: {
                            type: 'password',
                            isRequired: true
                        },
                    },
                }

            }
        ],
        pages: {
            'Server Status': {
                label: 'Server Details',
                handler: async (req, res, context) => {
                    return {
                        osdata: {
                            os: os.platform(),
                            arch: process.arch,
                            version: os.version(),
                            uptime: apifunction.updatetime(os.uptime()),
                            cpu: await apifunction.cpustats(os),
                            freemem: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
                            totalmem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
                            network: apifunction.networkInterfaces(os.networkInterfaces()),
                            hostname: os.hostname(),
                            cpus: os.cpus(),
                            disks: apifunction.diskinfo(nodeDiskInfo.getDiskInfoSync()),
                            mysqlstatus: 1,
                            currenDate: date.format(new Date(), 'MMM DD YYYY HH:mm:ss'),
                        }
                    }
                },
                component: AdminJS.bundle('./components/serverdetail'),
            },
            'Services Status': {
                isVisible: false,
                label: 'Services Status',
                options: {
                    navigation: {
                        name: 'Services Status',
                        icon: 'Database',
                    },
                },
                handler: async (req, res, context) => {
                    var status = await apifunction.radiusstatus()
                    console.log(status)
                    return {
                        mysqlstatus: {
                            mysqlstatus: 'Running',
                            tables: await apifunction.mysqltables(db),
                            radiusstatus: status.status == false ? 'Disabled' : 'Running',
                        }
                    }
                },
                component: AdminJS.bundle('./components/servicestatus'),
            }
        },
        dashboard: {
            handler: async (req, res, context) => {
                return {
                    serverdata: {
                    }
                }
            },
            component: AdminJS.bundle('./components/dashboard')
        },
        locale: {
            translations: {
                labels: {
                    welcome: 'Welcome to Smarter VPN',
                    loginWelcome: 'Welcome to Smarter VPN',
                    users: 'Users',
                    nas: 'NAS',
                    apikeys: 'API Key',
                    serverlist: 'VPN Servers',
                    pages: 'Status',
                },
                resources: {
                    users: {
                        properties: {
                            id: 'ID',
                            username: 'Username',
                            value: 'Password',
                            attribute: 'Password Type',
                            createdAt: 'Created At',
                        },
                    },
                    nas: {
                        properties: {
                            id: 'ID',
                            nasname: 'NAS IP/Host',
                            shortname: 'NAS Shortname',
                            type: 'NAS Type',
                            secret: 'NAS Secret',
                            ports: 'NAS Ports',
                            server: 'NAS Virtual Server',
                            community: 'NAS Community',
                            description: 'NAS Description'
                        }
                    },
                    apikeys: {
                        actions: {
                            new: 'Generate New'
                        },
                        properties: {
                            description: 'Description',
                            id: 'ID',
                            apikey: 'API Key',
                            status: 'Status',
                        }
                    },
                    serverlist: {
                        properties: {
                            id: 'ID',
                            status: 'Server Status',
                            server_group_id: 'Server Group',
                            server_ip: 'Server IP/Host Name',
                            sshport: 'SSH Port',
                            server_port: 'VPN Port',
                            service_status: 'Services Status(ikev2,openvpn)',
                        }
                    },
                },
                messages: {
                    loginWelcome: '',
                },
            },

        },
        branding: {
            logo: '',
            companyName: 'Smarters VPN Panel',
            withMadeWithLove: false,
            softwareBrothers: false,
        },
        assets: {
            styles: ['/styles.css'],
        },
    }
    const admin = new AdminJS(options)
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
        authenticate,
        cookieName: 'adminjs',
        cookiePassword: 'sessionsecret',
    }, null, db
    )
    // app.use(express.static(__dirname + '/public'));
    app.use(admin.options.rootPath, adminRouter)
    app.use(express.json());
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }));
    //api urls
    app.group("/api/v1", (router) => {
        router.get('/', (req, res) => {
            res.json({
                status: "success",
                message: "Smarter VPN API",
                data: {
                    version: "v1.0.0"
                }
            })
        })
        // check login 
        router.use((req, res, next) => {
            // let fullUrl = req.protocol;
            // console.log("full url ==> ", appurl);
            checklogin.checklogin(req, res, db).then((result) => {
                if (result) {
                    next();
                } else {
                    res.status(401).json({ error: 'Unauthorized' });
                }
            })
        })
        // add user
        router.post('/adduser', (req, res) => {
            apifunction.adduser(req, res, db)
        })
        // delete user
        router.delete('/deleteuser', (req, res) => {
            apifunction.deleteuser(req, res, db)
        })
        //get online users
        router.get('/getonlineusers', (req, res) => {
            apifunction.onlineusers(req, res, db)
        })
        // get online users by username
        router.post('/onlineuserswithusername', (req, res) => {
            apifunction.onlineusersnasuser(req, res, db)
        })
        // get online users by nas
        router.get('/onlineusersnas/:nas', (req, res) => {
            apifunction.onlineusersnas(req, res, db)
        })
        // suspend user
        router.post('/suspenduser', (req, res) => {
            apifunction.suspenduser(req, res, db, date)
        })
        // unsuspend user
        router.post('/unsuspenduser', (req, res) => {
            apifunction.unsuspenduser(req, res, db)
        })
        // update user
        router.post('/updateuser', (req, res) => {
            apifunction.updateuser(req, res, db)
        })
        // remove nas
        router.delete('/removenas', (req, res) => {
            apifunction.removenas(req, res, db)
        })
        // add nas
        router.post('/addnas', (req, res) => {
            apifunction.addnas(req, res, db)
        })
        //get nas
        router.get('/getnas', (req, res) => {
            apifunction.getnas(req, res, db)
        })

        //get vpn server
        router.get('/getvpnserver', (req, res) => {
            apifunction.vpngetvpnserverstatus(req, res, db)
        })
        // add vpn server 
        router.post('/addvpnserver', (req, res) => {
            apifunction.vpnaddvpnserver(req, res, db, date)
        })
        // install vpn server 
        router.post('/installvpnserver', (req, res,) => {
            apifunction.vpnserverinstall(req, res, db)
        })

        // uninstall vpn server
        router.post('/uninstallvpnserver', (req, res) => {
            apifunction.vpnuninstallvpnserver(req, res, db)
        })
        // vpn server restart
        router.post('/restartvpnserver', (req, res) => {
            apifunction.vpnrestartvpnserver(req, res, db)
        })
        // vpn server reboot
        router.post('/rebootvpnserver', (req, res) => {
            apifunction.vpnrebootvpnserver(req, res, db)
        })
        // update vpn server 
        router.post('/updatevpnserver', (req, res) => {
            apifunction.vpnupdatevpnserver(req, res, db)
        })
        router.post('/reinstallvpnserver', (req, res) => {
            apifunction.vpnresinstallvpnserver(req, res, db)
        })
        //callbackurl For VPN Server
        router.post('/vpncallbackurl', (req, res) => {
            apifunction.callbackurl(req, res, db)
        })
        // add server groups 
        router.post('/addservrergroup', (req, res) => {
            apifunction.addservergroup(req, res, db)
        })
        // get server group by id 
        router.get('/getservergroupbyid/:id', (req, res) => {
            apifunction.getservergroupbyid(req, res, db)
        })
        // get server group
        router.get('/getservergroups', (req, res) => {
            apifunction.getservergroups(req, res, db)
        })
        // delete server group
        router.delete('/deleteservergroup/:id', (req, res) => {
            apifunction.deleteservergroup(req, res, db)
        })

        // delete vpn server
        router.delete('/deletevpnserver/:id', (req, res) => {
            apifunction.deletevpnserver(req, res, db)
        })
        // update server group 
        router.post('/updateservergroup/:id', (req, res) => {
            apifunction.updateservergroup(req, res, db)
        })
        // get server list by server group id
        router.get('/getserverlistbygroupid/:id', (req, res) => {
            apifunction.getserverlistbyservergroupid(req, res, db)
        })
        // get server groups with server list
        router.get('/getservergroupswithserverlist', (req, res) => {
            apifunction.getservergroupswithserverlist(req, res, db)
        })
        // delete server from server group
        router.delete('/deleteservergroup/:id', (req, res) => {
            apifunction.deleteservergroup(req, res, db)
        })
        // download openvpn config
        router.post('/downloadovpn', (req, res) => {
            apifunction.downloadopenvpnconfig(req, res, db)
        })
        //  server installation logs
        router.get('/serverinstallationlogs/:id', (req, res) => {
            apifunction.serverinstallationlogs(req, res, db)
        })

        router.use((req, res) => {
            res.status(404).json({ error: 'route not found' });
        })
    })
    app.listen(PORT, () => {
        console.log(`AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`)
    })
}
start()
