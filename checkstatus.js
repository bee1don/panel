const { Sequelize } = require('sequelize')
const dbconfig = require('./db');
const axios = require("axios");
const CronJob = require('cron').CronJob;

const job = new CronJob('*/5 * * * *', async function () {
    console.log('You will see this message every 5 min for service status');
    const sequelize = new Sequelize(dbconfig.dbname, dbconfig.dbuser, dbconfig.dbpassword, {
        host: dbconfig.dbhost,
        dialect: 'mysql'
    });
    const db = {};

    db.Sequelize = Sequelize;
    db.sequelize = sequelize;
    db.radcheck = require('./models/radcheck')(sequelize, Sequelize);
    module.exports = db;


    // fetch server status
    const getServerStatus = async function (servrerurl) {
        return new Promise((resolve, reject) => {
            axios.get(servrerurl).then((response) => {
                // console.log("return", response.data)
                resolve(response.data);
            }).catch((err) => {
                console.log(err)
                reject(err);
            })
        })
    }

    try {
        await db.sequelize.query('SELECT * FROM server_list WHERE status != "Processing"', { type: sequelize.QueryTypes.SELECT })
            .then(function (data) {
                data.map((server) => {
                    var status1 = getServerStatus('http://' + server.server_ip + ':4545/ikev2.txt');
                    var status2 = getServerStatus('http://' + server.server_ip + ':4545/openvpn.txt');
                    Promise.all([status1, status2]).then((result) => {
                        status1 = result[0].trim();
                        status2 = result[1].trim();
                        statusfirst = result[0].charAt(0).toUpperCase() + result[0].slice(1);
                        statussecond = result[1].charAt(0).toUpperCase() + result[1].slice(1);
                        var serverstatus = "Online";
                        if (status1 == "online" && status2 == "online") {
                            serverstatus = "Online";
                        } else if (status1 == "offline" && status2 == "online") {
                            serverstatus = "Online";
                        } else if(status1 == "online" && status2 == "offline") {
                            serverstatus = "Online";
                        } else if (status1 == "offline" && status2 == "offline") {
                            serverstatus = "Offline";
                        }
                        db.sequelize.query('UPDATE server_list SET status = "' + serverstatus + '", service_status = "' + statusfirst + ',' + statussecond + '" WHERE server_ip = ?', { replacements: [server.server_ip], type: sequelize.QueryTypes.UPDATE })

                    }).catch((err) => {
                        db.sequelize.query('UPDATE server_list SET status = "Offline", service_status = "Offline,Offline" WHERE server_ip = ?', { replacements: [server.server_ip], type: sequelize.QueryTypes.UPDATE })
                        console.log(err)
                    })
                })
            });
    } catch (error) {
        console.log(error)
    }

    console.log('You will see this message every 5 min for server status');
    try {
        const sequelize = new Sequelize(dbconfig.dbname, dbconfig.dbuser, dbconfig.dbpassword, {
            host: dbconfig.dbhost,
            dialect: 'mysql'
        });
        const db = {};

        db.Sequelize = Sequelize;
        db.sequelize = sequelize;
        db.radcheck = require('./models/radcheck')(sequelize, Sequelize);
        module.exports = db;
        const getVpnData = async function (servrerurl) {
            return new Promise((resolve, reject) => {
                axios.get(servrerurl).then((response) => {
                    // console.log("return", response.data)
                    resolve(response.data);
                }).catch((err) => {
                    console.log(err)
                    reject(err);
                })
            });
        }

        await db.sequelize.query('SELECT * FROM server_list WHERE status = "Online"', { type: sequelize.QueryTypes.SELECT })
            .then(function (data) {
                data.map((server) => {
                    var newdata = getVpnData('http://' + server.server_ip + ':4545');
                    Promise.all([newdata]).then((result) => {
                        console.log(result[0])
                        var vpnData = result[0];
                        var resp = vpnData.split(",");
                        db.sequelize.query('UPDATE server_list SET memory = "' + resp[1] + '",cpu = "' + resp[0] + '",disk = "' + resp[2] + '",upload = "' + resp[5] + '",download="' + resp[4] + '",totald="' + resp[6] + '",uptime="' + resp[3] + '" WHERE server_ip = ?', { replacements: [server.server_ip], type: sequelize.QueryTypes.UPDATE })
                    }).catch((err) => {
                        db.sequelize.query('UPDATE server_list SET memory = "0",cpu = "0",disk = "0",upload = "0",download="0",totald="0",uptime="0" WHERE server_ip = ?', { replacements: [server.server_ip], type: sequelize.QueryTypes.UPDATE })
                        console.log(err)
                    })

                });
            });

    } catch (error) {
        console.log(error)
    }


    // remove Stale Connection

    console.log('You will see this message every 5  min for stale connection');
    try {
        const sequelize = new Sequelize(dbconfig.dbname, dbconfig.dbuser, dbconfig.dbpassword, {
            host: dbconfig.dbhost,
            dialect: 'mysql'
        });
        const db = {};
        db.Sequelize = Sequelize;
        db.sequelize = sequelize;
        db.radcheck = require('./models/radcheck')(sequelize, Sequelize);
        module.exports = db;
        let thresholdTime = 30;
        let graceTime = 60;
        // db.sequelize.query('UPDATE radacct SET  acctstoptime = NOW() WHERE (acctstoptime IS NULL AND acctstarttime < DATE_SUB(NOW(), INTERVAL 10 MINUTE))', { type: sequelize.QueryTypes.DELETE })
        await db.sequelize.query('UPDATE radacct SET acctstoptime=NOW(), AcctTerminateCause="stale-session" WHERE ((UNIX_TIMESTAMP(NOW()) - (UNIX_TIMESTAMP(acctstarttime) + acctsessiontime)) > (' + (thresholdTime + graceTime) + ')) AND (acctstoptime IS NULL)', { type: sequelize.QueryTypes.UPDATE })
    } catch (error) {
        console.log(error)
    }
});
job.start();
