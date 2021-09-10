Vue.prototype.moment = moment
new Vue({
    el: '#app',
    data: {
        UI: {
            notify: false,
            notifyMessage: "Hello World",
            notifyColour: "info",
            notifyTimeout: 2000,
            consoleInput: "",
            manualControl: {
                movementSetting: 1,
                extruderSetting: 1,
                temperatureSetting: 1,
            },
            fileDialog: false,

        },
        wsDebug: "Nothing",
        wsMessage: "Nothing",
        wsState: "Unknown",
        socket: null,
        files: {
            
            list: {},
            listSearch: "",
            listHeaders: [
                {text: "filename", value: "filename"},
                {text: "estimated_time", value: "estimated_time"},
                {text: "layer_height", value: "layer_height"},
                // {text: "slicer", value: "slicer"},
                {text: "bedtemp", value: "first_layer_bed_temp"},
                {text: "etemp", value: "first_layer_extr_temp"},
                {text: "Modified", value: "modified"},
                // {text: "Size", value: "size"},
            ],
// { "dirs": [], "files": [ { "modified": 1630714450.8669238, "size": 1343828, "filename": "20mm_Extrusion_Mount.gcode", "slicer": "PrusaSlicer", "slicer_version": "2.3.0+linux-x64-GTK3", "layer_height": 0.3, "first_layer_height": 0.3, "object_height": 15.25, "filament_total": 9510.62, "filament_weight_total": 0, "estimated_time": 4443, "first_layer_bed_temp": 110, "first_layer_extr_temp": 230, "gcode_start_byte": 293, "gcode_end_byte": 1334862, "print_start_time": 1630714451.3770616, "job_id": "000004" }, { "modified": 1630711243.6083462, "size": 574972, "filename": "key.gcode", "slicer": "PrusaSlicer", "slicer_version": "2.3.0+linux-x64-GTK3", "layer_height": 0.2, "first_layer_height": 0.2, "object_height": 12.25, "filament_total": 669.94, "filament_weight_total": 0, "estimated_time": 1281, "first_layer_bed_temp": 110, "first_layer_extr_temp": 230, "gcode_start_byte": 293, "gcode_end_byte": 566010, "print_start_time": 1630711244.111461, "job_id": "000002" }, { "modified": 1630712881.2514064, "size": 2954392, "filename": "Katze-Liebe.gcode", "slicer": "PrusaSlicer", "slicer_version": "2.3.0+linux-x64-GTK3", "layer_height": 0.3, "first_layer_height": 0.3, "object_height": 15.25, "filament_total": 7106.19, "filament_weight_total": 0, "estimated_time": 3613, "first_layer_bed_temp": 110, "first_layer_extr_temp": 230, "gcode_start_byte": 293, "gcode_end_byte": 2945426, "print_start_time": 1630712881.602267, "job_id": "000003" }, { "modified": 1625258469.004147, "size": 1249319, "filename": "cube.gcode", "slicer": "Cura", "slicer_version": "4.10.0", "layer_height": 0.2, "first_layer_height": 0.2, "object_height": 20, "filament_total": 1641.92, "estimated_time": 2082, "first_layer_bed_temp": 60, "first_layer_extr_temp": 200, "gcode_start_byte": 178, "gcode_end_byte": 1248600, "print_start_time": 1630710793.332263, "job_id": "000000" }, { "modified": 1630468766.743209, "size": 308, "filename": "dwell.gcode", "slicer": "Cura", "slicer_version": "4.10.0", "layer_height": 0.2, "first_layer_height": 0.2, "object_height": 20, "filament_total": 1641.92, "estimated_time": 50, "gcode_start_byte": 177, "gcode_end_byte": 300,
        },
        printer: {
            objects: {},
            capabilities: {},
            queryResult: {},
            queryReady: false,
            extruders: {},
            macros: [],
            temperature_store: {},
            printStatus: {
                state: "unknown",
                stateMessage: "unknown",
                progress: 0,
                isActive: false,
                filePath: null, //null no print
                fileName: "",
                fileMetadata: {}
            },
            console: {
                result: {
                    gcode_store: ""
                }
            },
        },
        server: {
            klippyConnected: false,
            klippyStatus: "disconnected",
            hostname: "localhost",
            port: "7125",
        },
        app: {
            webcamUrl: "localhost",
            webcamEnabled: false,
            debug: true,
            debugMessageID: 9000,
            timer: '',
        }
    },
    methods: {
        notification: function (m, i) {

            this.UI.notifyMessage = m;

            var colour = "purple accent-3"

            if (i === 0) {
                colour = "grey lighten-3"
            }
            if (i === 1) {
                colour = "light-blue darken-1"
            }
            if (i === 2) {
                colour = "lime darken-1"
            }
            if (i === 3) {
                colour = "yellow darken-1"
            }
            if (i === 4) {
                colour = "deep-orange darken-1"
            }
            if (i === 5) {
                colour = "purple lighten-1"
            }
            this.UI.notifyColour = colour
            this.UI.notify = true
            console.log("notify:" + m)
        },
        consoleScroll: function () {
            var element = document.getElementById("console");
            element.scrollTop = element.scrollHeight;
        },
        gcode(s) {
            this.wsSend('printer.gcode.script', {
                'script': s
            })
        },

        // eta: function(e){
        //     var times = Vue.prototype.moment().duration(e, 'seconds');
        //     var formatted = times.moment().format("hh:mm:ss");
        //     return formatted
        // },


        wsSend: function (m, p, id) {
            var rNumber = this.randomID()
            if (id) {
                rNumber = id
            }
            var command = {
                "jsonrpc": "2.0",
                "method": m,
                "id": rNumber
            }
            if (p) {
                command["params"] = p
            }
            
            this.socket.send(JSON.stringify(command))
        },

        wsConnect: function () {
            console.log("Connecting")
            this.socket = new WebSocket('ws://' + this.server.hostname + ':' + this.server.port + '/websocket');
            this.socket.onopen = () => this.wsState = "Open";
            this.socket.onclose = () => this.wsState = "Closed";
            this.socket.onerror = () => this.wsState = "Error";

        },
        randomID: function () {
            return Math.round(Math.random() * 1000);
        },


        cancelAutoUpdate: function () {
            clearInterval(this.app.timer)
        },
        beforeDestroy: function () {
            clearInterval(this.app.timer)
        },


        //stateHandler: function(e)


        watchDog: function () {

            this.socket.onmessage = (event) => {
                this.wsMessage = JSON.parse(event.data)

                if (this.wsMessage.method) {

                    if (this.wsMessage.method == "notify_gcode_response") {
                        this.wsSend('server.gcode_store', {
                            count: 50
                        }, 65536)
                    }
                    if (this.wsMessage.method == "notify_klippy_disconnected") {
                        this.notification("Klipper Disconnected", 3);
                        this.server.klippyConnected = false;
                        this.server.klippyState = "disconnected";
                    }

                    if (this.wsMessage.method == "notify_klippy_shutdown") {
                        this.notification("Klipper Shutdown", 4);
                        this.server.klippyConnected = false;
                        this.server.klippyState = "shutdown";
                    }


                    if (this.wsMessage.method == "notify_klippy_ready") {
                        this.notification("Klipper Ready", 2);
                        this.server.klippyConnected = true;
                        this.server.klippyState = "ready";
                    }
                }



                if (this.wsMessage.id) {
                    var id = this.wsMessage.id
                    var placeholder = this.wsMessage


                    //DEBUG//DEBUG//DEBUG//
                    if (id === this.app.debugMessageID) {
                        this.wsDebug = placeholder;
                    }


                    if (id === 9000) {
                        this.server.klippyConnected = this.wsMessage.result.klippy_connected
                        this.server.klippyState = this.wsMessage.result.klippy_state
                    }



                    if (id === 9001) {
                        this.printer.objects = this.wsMessage.result.objects
                        for (i in this.printer.objects) {
                            if (this.printer.objects[i].includes("gcode_macro")) {
                                if (!this.printer.macros.includes(this.printer.objects[i].split(" ")[1])) {
                                    this.printer.macros.push(this.printer.objects[i].split(" ")[1])
                                }
                            }
                        }
                        for (var i = 0; i < this.printer.macros.length; i++) {
                            if (!this.printer.objects.includes("gcode_macro " + this.printer.macros[i])) {
                                this.printer.macros.splice(i, 1)
                            }
                        }

                        this.printer.capabilities = {
                            'objects': {}
                        }
                        for (i in this.printer.objects) {
                            this.printer.capabilities.objects[this.printer.objects[i]] = null
                        }

                    }

                    if (id === 9002) {
         
                        this.printer.queryResult = this.wsMessage.result

                       if(typeof(this.printer.queryResult) == "undefined")
                       {
                           this.printer.queryReady = false
                           return
                       }
                       else{
                           this.printer.queryReady = true
                       }

                       if(this.server.klippyState != "ready"){
                        console.log("query fallback")
                       this.printer.printStatus.stateMessage = this.printer.queryResult.status.webhooks.state_message
                       }
                       else{
                        // console.log("query")
                        this.printer.printStatus.progress = Math.round(this.printer.queryResult.status.virtual_sdcard.progress * 100)
                        switch (this.printer.queryResult.status.print_stats.state) {
                            case 'complete':
                                this.printer.printStatus.progress = 100;
                            case 'standby':
                            case 'printing':
                            case 'paused':
                            case 'error':

                        }


                        this.printer.printStatus.state = this.printer.queryResult.status.print_stats.state
                        this.printer.printStatus.isActive = this.printer.queryResult.status.virtual_sdcard.is_active
                        this.printer.printStatus.filePath = this.printer.queryResult.status.virtual_sdcard.file_path
                        if (this.printer.printStatus.filePath) {
                            
                            this.printer.printStatus.fileName = this.printer.queryResult.status.virtual_sdcard.file_path.split("/").pop()
                        } else {
                            if (this.printer.queryResult.status.print_stats.filename){
                                this.printer.printStatus.fileName = this.printer.queryResult.status.print_stats.filename
                            }
                        }


                        
                    
                        this.printer.extruders = {}
                        for (i in this.printer.queryResult.status.motion_report.steppers){
                            if (this.printer.queryResult.status.motion_report.steppers[i].includes("extruder")){
                            this.printer.extruders[this.printer.queryResult.status.motion_report.steppers[i]] = "T"+i
                        }
                        }
                        // if (this.wsMessage.result.status.heaters.available_heaters.extruder){

                        // }
                        //this.printer.printStatus.progress = this.wsMessage.result.status.virtual_sdcard.file_position / 100


                        //   paused: false, //progress >0 and active false.
                        // progress: 0,
                        // file_position: 0,
                        // is_active: false,
                        // file_path: null, //null no print
                        // fileName: "",



                        // heaters for i in. query. result.status.i. measured_min_temp measured_max_temp temperature
                        //                 result.status.heaters available_sensors available_heaters


                    }
                }
                    if (id === 9003) {
                        this.printer.console = placeholder
                    }

                    if (id === 9004) {
                        this.files.list = this.wsMessage.result
                    }
                    if (id === 9005) {
                        this.printer.printStatus.fileMetadata = this.wsMessage.result
                    }
                }
            }

            if (this.wsState === "Open") {
                this.wsState = "Open"

                if (this.server.klippyConnected) {

                    if (this.server.klippyState == "ready"){
                    this.wsSend('server.info', null, 9000);
                    this.wsSend('printer.objects.list', null, 9001);
                    this.wsSend('printer.objects.query', this.printer.capabilities, 9002);
                    this.wsSend('server.gcode_store', {
                        count: 50
                    }, 9003)
                    this.consoleScroll()

                    // get file list with metadata
                    // this.wsSend('server.files.get_directory',{"extended":true},9004)

                    if(this.printer.printStatus.fileName){
                        this.wsSend('server.files.metadata',{'filename':this.printer.printStatus.fileName},9005)
                    }

                }
                else{
                    this.wsSend('server.info', null, 9000);
                    this.wsSend('printer.objects.query', {"objects": {"webhooks": null}}, 9002);
                }
                } else {
                    this.wsSend('server.info', null, 9000);
                }
            }

            if (this.wsState === "Closed") {
                this.wsState = "Closed"
                this.notification("Moonraker Connection Issue, Reconnecting", 3)
                console.log("Moonraker Connection Issue, Reconnecting")
                this.wsConnect()
            }
        }
    },
    mounted: function () {
        this.$vuetify.theme.dark = true;
        console.log("Mounting")

        fetch("paddleconfig.json")
            .then(response => response.json())
            .then(data => {
                this.server.hostname = data.hostname;
                this.server.port = data.port;
                this.app.debug = data.debug;
                this.app.webcamUrl = data.WebcamUrl;
                this.app.webcamEnabled = data.webcamEnabled;
            });

        this.wsConnect()
        this.watchDog()
        this.app.timer = setInterval(this.watchDog, 500)

    },
    vuetify: new Vuetify(),
})