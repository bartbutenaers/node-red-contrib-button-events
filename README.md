# node-red-contrib-button-events
A Node-RED node to send events based on button actions.

I would really like to thank [Bryan Nielsen](https://github.com/bnielsen1965) for the tremendous support when integrating his [button-events](https://github.com/bnielsen1965/button-events) library into Node-RED!

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-button-events
```

## Node Usage

When a `0` or `1` arrives in the specified input message field (arriving e.g. from a button connected to a GPIO input node), then this node will determine which kind of event has occured and send the event type in the specified output message field:

![Example flow](https://user-images.githubusercontent.com/14224149/94481191-a56e5580-01d7-11eb-8a3c-a0f13883eb0c.png)
```
[{"id":"e94468b6.358e18","type":"debug","z":"2203d76d.b17558","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":930,"y":260,"wires":[]},{"id":"4bc6d6f0.115498","type":"inject","z":"2203d76d.b17558","name":"","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"0","payloadType":"num","x":350,"y":260,"wires":[["3a1329d1.7b0676"]]},{"id":"c6658632.447978","type":"button-events","z":"2203d76d.b17558","name":"","inputField":"payload","inputFieldType":"msg","outputField":"payload","outputFieldType":"msg","usePullUp":true,"clickedInterval":"200","pressedInterval":"1000","debounceInterval":30,"x":720,"y":260,"wires":[["e94468b6.358e18"]]},{"id":"9130e7a8.87df08","type":"inject","z":"2203d76d.b17558","name":"","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"1","payloadType":"num","x":350,"y":320,"wires":[["3a1329d1.7b0676"]]},{"id":"3ac673fa.12ef9c","type":"ui_chart","z":"2203d76d.b17558","name":"Poor man oscilloscope","group":"27b65cf1.24c8e4","order":3,"width":0,"height":0,"label":"Poor man oscilloscope","chartType":"line","legend":"false","xformat":"HH:mm:ss","interpolate":"step","nodata":"","dot":false,"ymin":"0","ymax":"2","removeOlder":1,"removeOlderPoints":"","removeOlderUnit":"3600","cutout":0,"useOneColor":false,"useUTC":false,"colors":["#1f77b4","#aec7e8","#ff7f0e","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5"],"useOldStyle":false,"outputs":1,"x":740,"y":320,"wires":[[]]},{"id":"3a1329d1.7b0676","type":"switch","z":"2203d76d.b17558","name":"","property":"payload","propertyType":"msg","rules":[{"t":"lt","v":"2","vt":"num"},{"t":"lt","v":"2","vt":"num"}],"checkall":"true","repair":false,"outputs":2,"x":530,"y":280,"wires":[["c6658632.447978"],["3ac673fa.12ef9c"]]},{"id":"27b65cf1.24c8e4","type":"ui_group","z":"","name":"HLS demo","tab":"787ed714.674938","order":1,"disp":true,"width":"12","collapse":false},{"id":"787ed714.674938","type":"ui_tab","z":"","name":"Code","icon":"dashboard","order":1,"disabled":false,"hidden":false}]
```
The specified output field will contain one of the following ***event types***:

+ `pressed`: when a button is pressed and held down. This will be followed with a `released` event, as soon as the button is released.
+ `clicked`: when a button is pressed and released rapidly.
+ `clicked_pressed`: if a click is quickly followed by pressing and holding the button, then a clicked_pressed event will be emitted. This will be followed by a `released` event, as soon as the button is released.
+ `double_clicked`: if a click is quickly followed with another click, then it is interpreted as a double click.
+ `released`: if the pressed button is released.

## Node properties

### Input
Specifies the input message field where the input value (`0` or `1`) will arrive.

### Output
Specifies the output message field where the detected event type will be stored.  When the *Output* field differs from the *Input* field, the original input message data will be kept intact and the message will be extended with the event type.

### Clicked
Specifies the interval (in milliseconds) to wait - after a button is released - before generating a `clicked` event.

### Pressed
Specifies the interval (in milliseconds) to wait - after a button is pressed - before generating a `pressed` event.

### Debounce
Specifies the interval (in milliseconds) to wait before considering the input signal to have stabilized.
