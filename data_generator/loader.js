const { MongoClient } = require('mongodb');

const databaseName = "audit_test"
const customerCollectionName = "customers"
const orderCollectionName = "orders"

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/drivers/node/ for more details
     */
    const username = "*********";
    const password = "*********"
    const uri = `mongodb+srv://${username}:${password}@xyzdata.5aaa5.mongodb.net/?retryWrites=true&w=majority`;
    
    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
     * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
     * pass option { useUnifiedTopology: true } to the MongoClient constructor.
     * const client =  new MongoClient(uri, {useUnifiedTopology: true})
     */

    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        await dropPreviousLoadIfExists(client)

        // do initial inserts 
        await bulkInsertCustomers(client, 1000)
        await bulkInsertOrders(client, 5000)
        
        // starts async load generator functions
        var promiseUpdateGeneratorOnCustomer = generateLoadForUpdatesOnCustomer(client, 1000)
        var promiseInsertGeneratorOnCustomer = generateLoadForInsertsOnCustomer(client, 2000)
        var promiseDeleteGeneratorOnCustomer = generateLoadForDeleteOnCustomer(client, 100)
        
        var promiseUpdateGeneratorOnOrder = generateLoadForUpdatesOnOrder(client, 3000)
        var promiseInsertGeneratorOnOrder = generateLoadForInsertsOnOrder(client, 2000)
        var promiseDeleteGeneratorOnOrder = generateLoadForDeletesOnOrder(client, 2000)
        

        // wait all load generator functions
        const [updateCustomer, insertCustomer, deleteCustomer, updateOrder] = await Promise.all([promiseUpdateGeneratorOnCustomer, promiseInsertGeneratorOnCustomer, promiseDeleteGeneratorOnCustomer, promiseUpdateGeneratorOnOrder, promiseInsertGeneratorOnOrder, promiseDeleteGeneratorOnOrder])
        
        console.log("All operations finished.")

    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

function generateCustomers(numberOfCustomers, startsWithCustomerId) {
    let customers = []

    for (var i=startsWithCustomerId; i<numberOfCustomers+startsWithCustomerId; i++) {
        let firstName = Math.random().toString(36).slice(2, 7); // random name
        let lastName = Math.random().toString(36).slice(2, 7); // random last name
        let address1 = Math.random().toString(36).slice(2, 15); // random last name
        let address2 = Math.random().toString(36).slice(2, 15); // random last name
        let addresses = []
        addresses.push(address1)
        addresses.push(address2)

        let customer = {
            _id: i,
            firstName: firstName,
            lastName: lastName,
            addresses: addresses
        }
        customers.push(customer)
    }

    return customers;
}

async function dropCollection(client, collectionName) {
    var returnResult;
    await client.db(databaseName).collection(collectionName).drop()
        .then(result => {
            console.log(`[Drop Collection Function] Successfully dropped the collection: ${collectionName}`);
            returnResult = true;
        })
        .catch(error => {
            console.log(`[Drop Collection Function] That's the error while dropping collection: ${JSON.stringify(error)}`)
            if (error.codeName === "NamespaceNotFound") { 
                console.log(`[Drop Collection Function] Collection ${collectionName} was not found to be dropped, but it's okay, we'll skip it`)
                returnResult = true
            } else {
                returnResult = false;
            }
        })
}

async function dropPreviousLoadIfExists(client) {
    var promiseCustomersCollectionDrop = dropCollection(client, customerCollectionName)
    var promiseOrderCollectionDrop = dropCollection(client, orderCollectionName)

    const [customersPromise, ordersPromise] = await Promise.all([promiseCustomersCollectionDrop, promiseOrderCollectionDrop])
    if (customersPromise && ordersPromise) { 
        return true
    }
    return false
}

async function bulkInsertCustomers(client, numberOfCustomers){
    const options = { ordered: false };
    var minimumAvailableCustomerId = -1
    const results = await client.db(databaseName).collection(customerCollectionName).find({}).sort({_id:-1}).limit(1).toArray()
    if (results === undefined || results.length === 0) {
        console.log("[Bulk Insert Customers Function] Customers collection is empty")
        minimumAvailableCustomerId = 0
    } else {
        minimumAvailableCustomerId = (results[0]._id) + 1
    }
    console.log(`[Bulk Insert Customers Function] Minimum available customer id:${minimumAvailableCustomerId}`)
    const fakeCustomers = generateCustomers(numberOfCustomers, minimumAvailableCustomerId) 
    console.log(`[Bulk Insert Customers Function] # of customers are going to be inserted: ${fakeCustomers.length}`)
    const result = await client.db(databaseName).collection(customerCollectionName).insertMany(fakeCustomers, options);
    console.log(`[Bulk Insert Customers Function] # of records were inserted into the collection customers: ${JSON.stringify(result.insertedCount)}`);
}

function generateOrders(numberOfOrders, minimumOrderId, minimumCustomerId, maximumCustomerId) { 
    var orders = []

    for (var i=0; i<numberOfOrders; i++) {

            var order = {}
            var numberOfOrderItemsPerOrder = Math.floor(Math.random()*5)
            var orderItems=[]
            for (var j=0; j<numberOfOrderItemsPerOrder; j++) {
                
                let orderItem = {}
                let productName = Math.random().toString(36).slice(2, 7); // random name
                let qty = Math.floor(Math.random() * 5)+1;
                let amount = Math.random() * 100

                orderItem = {
                    orderItemNo: j,
                    productName: productName, 
                    qty: qty,
                    amount: amount
                }
                orderItems.push(orderItem)
            }

            var randomCustomerId = Math.floor((Math.random()*(maximumCustomerId-minimumCustomerId))+minimumCustomerId)
            order = {
                _id: i+minimumOrderId,
                customerId: randomCustomerId,
                orderItems: orderItems,
                orderDate: new Date()
            }
            orders.push(order)
    }
    return orders
}

async function bulkInsertOrders(client, numberOfOrders){
    const options = { ordered: false };
    var minimumAvailableOrderId = -1

    const results = await client.db(databaseName).collection(orderCollectionName).find({}).sort({_id:-1}).limit(1).toArray()
    if (results === undefined || results.length === 0) {
        console.log("[Bulk Insert Orders Function] Orders collection is empty")
        minimumAvailableOrderId = 0
    } else {
        minimumAvailableOrderId = (results[0]._id) + 1
    }
    console.log(`[Bulk Insert Orders Function] Minimum available order id:${minimumAvailableOrderId}`)


    pipeline = [
        {
            '$group' : {
                '_id': null,
                'maxId': {'$max': '$_id'},
                'minId': {'$min': '$_id'}
            }
        }
    ]

    const minMaxCustomerId = await client.db(databaseName).collection(customerCollectionName).aggregate(pipeline).toArray()
    const maximumCustomerId = minMaxCustomerId[0].maxId
    const minimumCustomerId = minMaxCustomerId[0].minId

    
    const fakeOrders = generateOrders(numberOfOrders, minimumAvailableOrderId, minimumCustomerId, maximumCustomerId)
    console.log(`[Bulk Insert Orders Function] # of orders are going to be inserted: ${fakeOrders.length}`)
    const result = await client.db(databaseName).collection(orderCollectionName).insertMany(fakeOrders, options);
    console.log(`[Bulk Insert Orders Function] # of records inserted into the collection orders: ${JSON.stringify(result.insertedCount)}`);
}

async function generateLoadForUpdatesOnCustomer(client, numberOfUpdates) {   
    const numberOfCustomers = await client.db(databaseName).collection(customerCollectionName).count()

    for (var i=0; i<numberOfUpdates; i++) {
        var randomCustomerId = Math.floor(Math.random()*numberOfCustomers)
        var updateFilter = {"_id": randomCustomerId}
        var randomLastName = Math.random().toString(36).slice(2, 7); // random last name
        var updateOperation = {"$set": {"lastName": randomLastName}}

        console.log(`[Update Load Generator on Customer] For update: filter: ${JSON.stringify(updateFilter)}, data: ${JSON.stringify(updateOperation)}`)
        const result = await client.db(databaseName).collection(customerCollectionName).updateOne(updateFilter, updateOperation);
        console.log(`[Update Load Generator on Customer] Update result: ${JSON.stringify(result)}`)
        await sleep(1000);
    }

}

async function generateLoadForInsertsOnCustomer(client, numberOfCustomers) {
    await bulkInsertCustomers(client, numberOfCustomers, 1000)
}

async function generateLoadForDeleteOnCustomer(client, numberOfDeletes) {
    await sleep(10000)

    const numberOfCustomers = await client.db(databaseName).collection(customerCollectionName).count()
    console.log(`[Delete Load Generator on Customer] Total number of customers:${numberOfCustomers}`)
    for (var i=0; i<numberOfDeletes; i++) {
        var randomCustomerId = Math.floor(Math.random()*numberOfCustomers)
        var deleteFilter = {"_id": randomCustomerId}
        console.log(`[Delete Load Generator on Customer] Delete filter: ${JSON.stringify(deleteFilter)}`)
        const result = await client.db(databaseName).collection(customerCollectionName).deleteOne(deleteFilter);
        console.log(`[Delete Load Generator on Customer] Delete result: ${JSON.stringify(result)}`)
        await sleep(10000)
    }
}


/////////

async function generateLoadForUpdatesOnOrder(client, numberOfUpdates) {   
    const numberOfOrders = await client.db(databaseName).collection(orderCollectionName).count()
    for (var i=0; i<numberOfUpdates; i++) {
        var randomOrderId = Math.floor(Math.random()*numberOfOrders)
        var updateFilter = {"_id": randomOrderId}
        var randomLocationName = Math.random().toString(36).slice(2, 7);
        var updateOperation = {"$set": {"location": randomLocationName}}

        console.log(`[Update Load Generator on Order] For update: filter: ${JSON.stringify(updateFilter)}, data: ${JSON.stringify(updateOperation)}`)
        const result = await client.db(databaseName).collection(orderCollectionName).updateOne(updateFilter, updateOperation);
        console.log(`[Update Load Generator on Order] Update result: ${JSON.stringify(result)}`)
        await sleep(500);
    }
}

async function generateLoadForInsertsOnOrder(client, numberOfOrders) {
    await bulkInsertOrders(client, numberOfOrders)
}

async function generateLoadForDeletesOnOrder(client, numberOfDeletes) {
    await sleep(10000)

    const numberOfOrders = await client.db(databaseName).collection(orderCollectionName).count()
    console.log(`[Delete Load Generator on Order] Total number of orders:${numberOfOrders}`)
    for (var i=0; i<numberOfDeletes; i++) {
        var randomOrderId = Math.floor(Math.random()*numberOfOrders)
        var deleteFilter = {"_id": randomOrderId}
        console.log(`[Delete Load Generator on Order] Delete filter: ${JSON.stringify(deleteFilter)}`)
        const result = await client.db(databaseName).collection(orderCollectionName).deleteOne(deleteFilter);
        console.log(`[Delete Load Generator on Order] Delete result: ${JSON.stringify(result)}`)
        await sleep(10000)
    }
}

function sleep(sleepInMilliseconds) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, sleepInMilliseconds);
    });
}


main().catch(console.error);