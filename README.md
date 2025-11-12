# Record Store Challenge API
## Description

This is a **NestJS** application starter with MongoDB integration. If necessary, it provides a script to boot a Mongo emulator for Docker. This setup includes end-to-end tests, unit tests, test coverage, linting, and database setup with data from `data.json`.

##  New Features Added
- **Large Dataset Testing**  
  Added a **100k-records dataset** along with performance and integration tests.

- **MusicBrainz API Integration**  
  Integrated the **MusicBrainz API** to fetch album metadata.

- **Order Transactions**  
  Added  **order functionality** with MongoDB **transaction support**.

- **Cursor-Based Pagination**  
  Added **cursor-based approach** for handling large datasets efficiently.

- **Caching Layer**  
  Integrated **@nestjs/cache-manager** for faster repeated queries.

- **Frontend Interface**  
  Added static HTML pages providing a simple UI for creating records.

- **E2E Frontend Tests**  
  Implemented automated **Playwright** end-to-end tests.


## Installation

### Install dependencies:

```bash
$ npm install
````

### Docker for MongoDB Emulator
To use the MongoDB Emulator, you can start it using Docker:
```
npm run mongo:start
```
This will start a MongoDB instance running on your local machine. You can customize the settings in the Docker setup by modifying the docker-compose-mongo.yml if necessary. In the current configuration, you will have a MongoDB container running, which is accessible at localhost:27017.
This mongo url will be necessary on the .env file, with example as follows:

```
MONGO_URL=mongodb://localhost:27017/records
```
This will point your application to a local MongoDB instance.

### MongoDB Data Setup
The data.json file contains example records to seed your database. The setup script will import the records from this file into MongoDB.

To set up the database with the example records:

```
npm run setup:db
```
This will prompt the user to cleanup (Y/N) existing collection before importing data.json


#### data.json Example
Here’s an example of the data.json file that contains records:
```
[
    {
        "artist": "Foo Fighters",
        "album": "Foo Fighers",
        "price": 8,
        "qty": 10,
        "format": "CD",
        "category": "Rock",
        "mbid": "d6591261-daaa-4bb2-81b6-544e499da727"
  },
  {
        "artist": "The Cure",
        "album": "Disintegration",
        "price": 23,
        "qty": 1,
        "format": "Vinyl",
        "category": "Alternative",
        "mbid": "11af85e2-c272-4c59-a902-47f75141dc97"
  },
]
```

### Running the App
#### Development Mode
To run the application in development mode (with hot reloading):

```
npm run start:dev
```
#### Production Mode
To build and run the app in production mode:

```
npm run start:prod
```

### Tests
#### Run Unit Tests
To run unit tests:

```
npm run test
```
To run unit tests with code coverage:

```
npm run test:cov
```
This will show you how much of your code is covered by the unit tests.
#### Run End-to-End Tests
To run end-to-end tests:
```
npm run test:e2e
```
Run Tests with Coverage

#### Run 100K records e2e test
Add the needed data first
```
npm run setup:100k-db
```
Run the test 
```
setup:db
```
#### Run Frontend End-to-End Tests
To run frontend end-to-end test:
```
npm run test:frontend-e2e
```


### Run Linting
To check if your code passes ESLint checks:

```
npm run lint
```
This command will show you any linting issues with your code.