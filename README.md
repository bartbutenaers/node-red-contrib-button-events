# node-red-contrib-button-events
A Node-RED node to send events based on button actions.

I would really like to thank [Bryan Nielsen](https://github.com/bnielsen1965) for the tremendous support when integrating his [button-events](https://github.com/bnielsen1965/button-events) library into Node-RED!

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-button-events
```

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node Usage

When the value of a button changes (high or low), this node will determine the kind of even that has happened:
+ A single click
+ A double click
+ A long press (i.e. keeping the button pressed)
+ A single click followed by a long press

Physical buttons can be read in many different ways, but a common case for Node-RED is (via an optocoupler) to the GPIO input pin of a Raspberry Pi:
+ Use a pull-up resistor to make sure the (idle) signal is `1`, and the button can pull the signal to `0` (gnd).
+ Use a pull-down resistor to make sure the (idle) signal is `0`, and the button can pull the signal `1` (vcc).

Note that the buttons will not switch between `0` and `1` perfectly, but the signal will toggle a number of times between both values.  This is called ***bouncing***.  While this node offers a very basic debouncing mechanism (by ignoring input messages during the debounce time interval), it might be advised to use the debounce mechanism of the gpio-in node itself (by setting the debounce time interval to zero).  Indeed otherwise all the switch values will travel through Node-RED from the gpio-in node to this node, and we would throw them away here.  Not optimal from a performance point of view ...

![Debounce](https://user-images.githubusercontent.com/14224149/95625417-bd1bc880-0a78-11eb-9370-1a74b8585bda.png)

When a button value  arrives in the specified input message field, then this node will determine which kind of event has occured on the button and send the event type in the specified output message field:

![Example flow](https://user-images.githubusercontent.com/14224149/95625116-42eb4400-0a78-11eb-8869-07c3b1a18d5f.png)
```
[{"id":"e94468b6.358e18","type":"debug","z":"2203d76d.b17558","name":"Clicked","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":860,"y":180,"wires":[]},{"id":"4bc6d6f0.115498","type":"inject","z":"2203d76d.b17558","name":"Inject 0","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"ZERO","payload":"0","payloadType":"num","x":250,"y":240,"wires":[["ecd423af.746cd"]]},{"id":"c6658632.447978","type":"button-events","z":"2203d76d.b17558","name":"","outputs":3,"inputField":"payload","inputFieldType":"msg","outputField":"payload","outputFieldType":"msg","downValue":"0","downValueType":"num","upValue":"1","upValueType":"num","idleValue":"1","clickedInterval":"2000","pressedInterval":"5000","debounceInterval":"200","events":[{"type":"clicked"},{"type":"pressed"},{"type":"double_clicked"}],"x":620,"y":200,"wires":[["e94468b6.358e18"],["625d6be5.811694"],["b0bd0d59.bc7cf"]]},{"id":"9130e7a8.87df08","type":"inject","z":"2203d76d.b17558","name":"Inject 1","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"ONE","payload":"1","payloadType":"num","x":250,"y":300,"wires":[["ecd423af.746cd"]]},{"id":"3ac673fa.12ef9c","type":"ui_chart","z":"2203d76d.b17558","name":"Poor man oscilloscope","group":"27b65cf1.24c8e4","order":3,"width":0,"height":0,"label":"Poor man oscilloscope","chartType":"line","legend":"false","xformat":"HH:mm:ss","interpolate":"step","nodata":"","dot":false,"ymin":"0","ymax":"2","removeOlder":1,"removeOlderPoints":"","removeOlderUnit":"3600","cutout":0,"useOneColor":false,"useUTC":false,"colors":["#1f77b4","#aec7e8","#ff7f0e","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5"],"useOldStyle":false,"outputs":1,"x":640,"y":300,"wires":[[]]},{"id":"ecd423af.746cd","type":"switch","z":"2203d76d.b17558","name":"","property":"payload","propertyType":"msg","rules":[{"t":"lt","v":"2","vt":"num"},{"t":"lt","v":"2","vt":"num"}],"checkall":"true","repair":false,"outputs":2,"x":430,"y":240,"wires":[["c6658632.447978"],["3ac673fa.12ef9c"]]},{"id":"b0bd0d59.bc7cf","type":"debug","z":"2203d76d.b17558","name":"Double clicked","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":880,"y":260,"wires":[]},{"id":"625d6be5.811694","type":"debug","z":"2203d76d.b17558","name":"Pressed","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":860,"y":220,"wires":[]},{"id":"27b65cf1.24c8e4","type":"ui_group","z":"","name":"HLS demo","tab":"787ed714.674938","order":1,"disp":true,"width":"12","collapse":false},{"id":"787ed714.674938","type":"ui_tab","z":"","name":"Code","icon":"dashboard","order":1,"disabled":false,"hidden":false}]
```
The detected event name will also be displayed in the status of the node.

## Timelines

The following timelines show how the button input is watched in the specified time intervals, and when which events are send in the output message.  The low-level events (which normally won't be used) are shown in blue, while the important user intent events are shown in red.

### Single-click timeline

When the button is clicked and released fast (i.e. *released within the "Pressed" time interval*), then the `clicked` event will be send:

![Single click](https://user-images.githubusercontent.com/14224149/94899160-142b0780-0493-11eb-83c8-fe181b18f9eb.png)

### Long-press timeline

When the button is clicked and kept down some time (i.e. *released after "Pressed" time interval*), then the `released` event will be send:

![Long press](https://user-images.githubusercontent.com/14224149/94899214-33299980-0493-11eb-8f03-5be40ff21472.png)

### Double-click timeline

When the button is clicked and released fast (i.e. *released within the "Pressed" time interval*), but it is clicked again immediately afterwards (i.e. *clicked again within the "Clicked" time interval*).  Then the `double-clicked` event will be send:

![Double click](https://user-images.githubusercontent.com/14224149/94997823-f9998100-05ad-11eb-926f-a10f9b8746fb.png)

### Clicked-pressed timeline

When the button is clicked and released fast (i.e. *released within the "Pressed" time interval*), but it is long clicked immediately afterwards (i.e. *long pressed again within the "Clicked" time interval*).  Then the `clicked-pressed` event will be send:

![Clicked pressed](https://user-images.githubusercontent.com/14224149/94899382-7f74d980-0493-11eb-9dd1-90be390dda8c.png)

## Node properties

### Input
Specifies the input message field where the input value (`0` or `1`) will arrive.

### Output
Specifies the output message field where the detected event type will be stored.  When the *Output* field differs from the *Input* field, the original input message data will be kept intact and the message will be extended with the event type.

### Clicked
Specifies the interval (in milliseconds) to wait - after a button is released - before generating a `clicked` event.  When a second click arrives within the *"Clicked"* interval, then both clicks will be combined to a `double-click` event.

### Pressed
Specifies the interval (in milliseconds) to wait - after a button is pressed - before generating a `pressed` event.  When the button is not being released within this interval, the button is kept down, e.g. for dimming a light.

### Debounce
Specifies the interval (in milliseconds) to wait before considering the input signal to have stabilized.  Within this time interval, all new input messages that arrive will be ignored.

### Down value
Specifies the value that will arrive when the button is down (i.e. clicked or pressed).   For example for a GPIO input with a pull-up resistor this will be `0`, or `1` in case of a pull-down resistor.

### Up value
Specifies the value that will arrive when the button is up (i.e. in normal status).  For example for a GPIO input with a pull-up resistor this will be `1`, or `0` in case of a pull-down resistor.

### Events
Add all events in the list, for which an output needs to be sent (when the event occurs).
The first 5 events indicate ***user intent*** event types:

+ `pressed`: when a button is pressed and held down. This will be followed with a `released` event, as soon as the button is released.
+ `clicked`: when a button is pressed and released rapidly.
+ `clicked_pressed`: if a click is quickly followed by pressing and holding the button, then a clicked_pressed event will be emitted. This will be followed by a `released` event, as soon as the button is released.
+ `double_clicked`: if a click is quickly followed with another click, then it is interpreted as a double click.
+ `released`: when the pressed button is released.

The last 3 events indicate low-level event types:

+ `button_changed`: when a button is pressed or released.
+ `button_press`: when a button is pressed.
+ `button_release`: When a button is released.

Note that those low level events will only be useful in special circumstances.
