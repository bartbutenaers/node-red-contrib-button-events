/**
 * Copyright 2020 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const ButtonEvents = require('button-events');
    
    const timeMarginMsClicked = 100;
    const timeMarginMsPressed = 250;
    const debounceTimeMs = 15;     // http://www.ganssle.com/debouncing.htm -> exceeds 15ms in very extreme cases, normaly well below 1ms. Means if one does not know it better 15ms should be very save.
    const limitDeltaTimeMs = 1500; // to filte first and last edges or very long breaks of clicking
 
    function createEventHandler(node, outputIndex) {
        var eventType = node.events[outputIndex].type;

        node.buttonEvents.on(eventType, function() {
            var outputs = [];
 
            try {
                RED.util.setMessageProperty(node.lastMsg, node.outputField, eventType);
            }
            catch (err) {
                node.error('Output property msg.' + node.outputField + ' cannot be set.');
                return;
            }
            
            for(var i = 0; i < node.events.length; i++) {
                if (i === outputIndex) {
                    outputs.push(node.lastMsg);
                }
                else {
                    outputs.push(null);
                }
            }
            
            node.send(outputs);
            
            node.status({fill:"blue", shape:"dot", text:eventType});
        });
    }
    
    function startCalibrationTimer(node) {
        // Stop the previous calibration timer, if it is running already
        if(node.calibrationTimer) {
            clearTimeout(node.calibrationTimer);
        }

        // Start a new timer that stops the calibration after 3 minutes of inactivity, to avoid confusion if people forget to turn it off
        node.calibrationTimer = setTimeout(function() {
            if(node.calibrating) {
                node.warn("Calibration is stopped automatically after 3 minutes of inactivity");
                stopCalibration(node);
            }
        }, 3 * 60 * 1000);
    }
    
    function stopCalibration(node) {
        // Stop the previous calibration timer, if it is running already
        if(node.calibrationTimer) {
            clearTimeout(node.calibrationTimer);
        }

        if(node.calibrating) {
            if(node.counter < 20){
                node.warn("Calibration with less than 10 cycles will result in less reliable results...");
            }
            
            var outputMsg = {
                topic: "calibration_results", 
                payload: {
                    "ClickedMs": node.maxReleasedTimeMs + timeMarginMsClicked,
                    "PressedMs": node.maxPressedTimeMs + timeMarginMsPressed ,
                    "DebounceMs": debounceTimeMs
                }
            }
            
            // Create an array with a null for each output
            var outputs = new Array(node.events.length).fill(null);
            
            // Specify that the output message should be send to every calibration output.
            // Cloning is required, to avoid conflicts in the flow since the same message is send on multiple outputs
            for(var i = 0; i < node.calibrationOutputs.length; i++) {
                var calibrationOuput = node.calibrationOutputs[i];
                outputs[calibrationOuput] = RED.util.cloneMessage(outputMsg);
            }
            
            // Send the calibration output to all the 'calibration' event outputs
            node.send(outputs);
            
            // Reset all calibration variables
            node.calibrating = false;
            node.deltaMs = 0;
            node.pressedEdgeMs = 0;
            node.releasedEdgeMs = 0;
            node.maxPressedTimeMs = 0;
            node.maxReleasedTimeMs = 0;
            node.counter = 0;
        }
                    
        node.status({ });
    }
    
    function ButtonEventsNode(config) {
        RED.nodes.createNode(this, config);
        this.inputField  = config.inputField;
        this.outputField = config.outputField;
        this.downValue   = config.downValue;
        this.upValue     = config.upValue;
        this.events      = config.events;
        this.lastMsg     = {};
        this.calibrationTimer = null;
        this.calibrationOutputs = [];
        this.calibrating = false;
        this.deltaMs = 0;
        this.pressedEdgeMs = 0;
        this.releasedEdgeMs = 0;
        this.maxPressedTimeMs = 0;
        this.maxReleasedTimeMs = 0;
        this.counter = 0;

        var node = this;
        
        // Retrieve the config node, where the timings are configured
        var buttonEventsConfig = RED.nodes.getNode(config.buttonEventsConfig);
        
        if (buttonEventsConfig) {
            node.debounceInterval = buttonEventsConfig.debounceInterval;
			node.pressedInterval  = buttonEventsConfig.pressedInterval;
			node.clickedInterval  = buttonEventsConfig.clickedInterval;
        }
        else {
            node.debounceInterval = config.debounceInterval;
			node.pressedInterval  = config.pressedInterval;
			node.clickedInterval  = config.clickedInterval;            
        }
        
        // We act like there is no pull-up resister (in case of a GPIO input): see below for more info...
        const settings = {
		  usePullUp: false,
		  timing: {
			debounce: node.debounceInterval,
			pressed:  node.pressedInterval,
			clicked:  node.clickedInterval
		  }
		};

		node.buttonEvents = new ButtonEvents(settings);

        if (config.events) {
            // Add an event handler for every specified event
            for (var i = 0; i < config.events.length; i++) {
                // The ButtonEvents library won't trigger any 'calibration' events, since that is a feature of this Node-RED node
                if(config.events[i].type === "calibration") {
                    node.calibrationOutputs.push(i);
                }
                else {
                    // Create the event handler inside a function, otherwise all handlers will use the latest 'i' value.
                    // See https://stackoverflow.com/questions/6487366/how-to-generate-event-handlers-with-loop-in-javascript
                    createEventHandler(node, i);
                }
            }
        }   

        node.on("input", function(msg) {  
            var inputValue;
            
            switch(msg.topic) {
                case "start_calibration":
                    if(node.calibrationOutputs.length === 0) {
                        node.warn("No calibration output has been specified in the node's config screen");
                        return;
                    }
 
                    if(node.calibrating) {
                        node.warn("Calibration is already active");
                        return;
                    }
                    
                    startCalibrationTimer(node);
                    
                    node.calibrating = true;
                    
                    node.status({fill:"blue", shape:"ring", text:"calibrating"});

                    break;
                case "stop_calibration":
                    if(node.calibrationOutputs.length === 0) {
                        node.warn("No calibration output has been specified in the node's config screen");
                        return;
                    }

                    if(!node.calibrating) {
                        node.warn("Calibration is not active");
                        return;
                    }

                    stopCalibration(node);

                    break;
                default: // All other messages will be considered as button clicks
                    try {
                        // Get the input value specified in the input message
                        inputValue = RED.util.getMessageProperty(msg, node.inputField);
                    }
                    catch (err) {
                        node.error('Input property msg.' + node.inputField + ' does not exist.');
                        return;
                    }
                    
                    // The button-events library always expects a 0 or 1 as input value, the button down/up values need to be mapped.
                    // We have specified above that usePullUp=false, which means (similar to a pull-down resistor behaviour) that:
                    // - A button down means that we measure a '1' (high signal)
                    // - A button up means that we measure a '0' (low signal)
                    if (inputValue == node.downValue) {
                        inputValue = 1;
                    }
                    else if (inputValue == node.upValue) {
                        inputValue = 0;
                    }
                    else {
                        node.error('Input property msg.' + node.inputField + ' should contain the specified low or high value.');
                        return;
                    }

                    if (node.calibrating) {
                        node.counter++; // iterate counter for click-edge countings
                        
                        // Restart the calibration timer every time a new value arrives
                        startCalibrationTimer(node);

                        if(inputValue == "1"){
                            /* pressed */
                            node.pressedEdgeMs = Date.now();
                            node.deltaMs = node.pressedEdgeMs - node.releasedEdgeMs;
                            
                            if(node.deltaMs > limitDeltaTimeMs){
                                node.counter = 1; // restart
                            }
                            else if(node.deltaMs > node.maxPressedTimeMs){
                                node.maxPressedTimeMs = node.deltaMs;
                            }
                            
                        }
                        else { // inputValue == "0"
                            /* released */
                            node.releasedEdgeMs = Date.now();
                            node.deltaMs = node.releasedEdgeMs - node.pressedEdgeMs;
                            
                            if(node.deltaMs > limitDeltaTimeMs){
                                node.counter = 1; // restart
                            }
                            else if(node.deltaMs > node.maxReleasedTimeMs){
                                node.maxReleasedTimeMs = node.deltaMs;
                            }
                        }
                    }
                    else {
                        // Analyze the input value, which is a button click in normal mode (i.e. not calibration)
                        var result = node.buttonEvents.gpioChange(inputValue)
                        
                        // Only remember the message when it has been used for the analysis.
                        // For example during the debounce period, the values will be ignored...
                        if (result === "accepted" || result === "final") {
                            node.lastMsg = msg;
                        }
                    }
            }
        });
      
        node.on("close",function() { 
            node.buttonEvents.cleanup();
            
            stopCalibration(node);
        });
    }
    RED.nodes.registerType("button-events",ButtonEventsNode);
}
