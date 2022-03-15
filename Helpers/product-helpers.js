var db = require('../config/connection')
var collection = require('../config/collection')
const async = require('hbs/lib/async')
const { response } = require('express')
const objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (product, callback) => {
        
        db.get().collection("product").insertOne(product).then((data) => {

            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection('product').find().toArray()
            resolve(products)
        }
        )
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection("product").remove({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetail:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection('product').findOne({_id:objectId(proId)})
                resolve(product)
            
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('product').
            updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Category:proDetails.Category,
                    Price:proDetails.Price
                }
            }).then(()=>{
                resolve()
            })
        })
    }
}
