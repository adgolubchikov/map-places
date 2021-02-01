## Installation
Run the project using Node.js
>node server.js
>
The server should listen at port 8080. To launch the project in browser open index.html file locally (or see demo at https://golubchikov.ml/map/). 
You can restore the database to default fetching /reset at the backend, or by executing reset() in frontend using console in developer tools. 

## Data model
Places are stored in global variable "data" and in data.json at the backend. It is an array of objects, see below:
>{
>id: Number, //Integer ID
>title: String, //Title
>description: String, //Description
>coords: [Number, Number], //Latitude and longtitude
>open: String, //Opening time like "8:00"
>close: String, //Closing time like "21:00"
>keywords: [String, ...], //array of keywords
>favourite: Boolean //Boolean value is place favourite or not
>}
>



