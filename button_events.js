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
    
    function ButtonEventsNode(config) {
        RED.nodes.createNode(this, config);
        this.inputField  = config.inputField;
        this.outputField = config.outputField;
        
        var node = this;
        
        const settings = {
		  usePullUp: config.usePullUp,
		  timing: {
			debounce: config.debounceInterval,
			pressed: config.pressedInterval,
			clicked: config.clickedInterval
		  }
		};

		node.buttonEvents = new ButtonEvents(settings);

		node.buttonEvents.on('button_event', function(eventType) {
            var outputMsg = {};
            
			try {
                RED.util.setMessageProperty(outputMsg, node.outputField, eventType);
            }
            catch (err) {
                node.error('Output property msg.' + node.outputField + ' cannot be set.');
                return;
            }
            
            node.send(outputMsg);
            
            node.status({fill:"blue", shape:"dot", text:eventType});
		});

        node.on("input", function(msg) {  
            var inputValue;
            
            try {
                // Get the input value specified in the input message
                inputValue = RED.util.getMessageProperty(msg, node.inputField);
            }
            catch (err) {
                node.error('Input property msg.' + node.inputField + ' does not exist.');
                return;
            }
            
            if (inputValue != 0 && inputValue != 1) {
                node.error('Input property msg.' + node.inputField + ' should contain 0 or 1.');
                return;                
            }
            
            node.buttonEvents.gpioChange(inputValue)
        });
      
        node.on("close",function() { 
            node.buttonEvents.cleanup();
            
            node.status({ });
        });
    }
    RED.nodes.registerType("button-events",ButtonEventsNode);
}
