var db = require('../config/connection')
var bcrypt = require('bcrypt')
const async = require('hbs/lib/async')
const { use } = require('../routes/user')
var ObjectId = require('mongodb').ObjectId
const { response } = require('../app')
module.exports = {
    addUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let check =  null
            check = await db.get().collection('user').findOne({ Email: userData.Email })
            if(check){
                 response.user = true
                 resolve(response)
             }else{
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection('user').insertOne(userData).then((response) => {
                response.user = false
                resolve(response)
            })
            }
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection('user').findOne({ Email: userData.Email })
            if (user) {

                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })

                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },

    getAllUser: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection('user').find().toArray()
            resolve(users)
        }
        )
    },
    addToCart: (proId, userId) => {
        let proObj={
            item : ObjectId(proId),
            quantity:1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection('cart').findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist=userCart.products.findIndex(product => product.item==proId)
                if(proExist!=-1){
                    db.get().collection('cart').updateOne({_id:ObjectId(userId),'products.item':ObjectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                  ).then(()=>{
                      resolve()
                  }) 
                }else{
                 db.get().collection('cart').updateOne({user:ObjectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((response)=>{
                    resolve()
                })
                }
             } else {
                let CartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection('cart').insertOne(CartObj).then((response) => {
                    resolve()
                })
            }
        })
    }, 
    cartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection('cart').aggregate([
                {
                    $match:{user:ObjectId(userId)},
                    
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:'product',
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },{
                    $project:{
                        quantity:1,item:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
           
            resolve(cartItems)
        })
    },
    cartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
        let count = 0
        let cart = await db.get().collection('cart').findOne({user:ObjectId(userId)})
        if (cart) {
            count=cart.products.length
        }
            resolve(count)
        })
    },
    changeQuantity:(details)=>{
        quantity=parseInt(details.quantity)
        count=parseInt(details.count)
        return new Promise((resolve,reject)=>{
            if(details.quantity==1 && details.count==-1){
                db.get().collection('cart').updateOne({_id:ObjectId(details.cart)},
                {
                    $pull:{products:{item:ObjectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection('cart').updateOne({_id:ObjectId(details.cart) ,'products.item':ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':count}
                }
                ).then((response)=>{
                    resolve({status:true})
                })
            }
            
        })
    },
    removeProduct:(details)=>{
        return new Promise((resolve,reject)=>{
                db.get().collection('cart').updateOne({_id:ObjectId(details.cart)},
                {
                    $pull:{products:{item:ObjectId(details.product)}}
                }
                ).then((response)=>{
                    resolve(true)
                })
        
    })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
             total = await db.get().collection('cart').aggregate([
                {
                    $match:{user:ObjectId(userId)},
                    
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:'product',
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        quantity:1,item:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
            
            ]).toArray()
            if(total.length===0){
                resolve()
            }else{
                resolve(total[0].total)    
            }
        })
    },
    cartproductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let proList = await db.get().collection('cart').findOne({user:ObjectId(userId)})
            resolve(proList.products)
        })
    },
    checkoutDetails:(details,proDetails)=>{
        return new Promise(async(resolve,reject)=>{
            let userOrder = await db.get().collection('order').findOne({ userId: ObjectId(details.userId) })
            let status = details.paymentMethod==='COD'?'PLACED':'PENDING'
            let orderObj ={ 
                user:ObjectId(details.userId),
        deliveryDetails:{
                name:details.firstName+' '+details.lastName,
                email:details.email,
                mobile:details.mobile,
                address:details.address+','+details.pin+','+details.state+','+details.country,
                pincode:details.pin
               },
                totalPrice:parseInt(details.total),
                paymentMethod:details.paymentMethod,
                products:proDetails,
                status:status,
                date: new Date()
                }       
           db.get().collection('order').insertOne(orderObj).then((response)=>{
               db.get().collection('cart').deleteOne({user:ObjectId(details.userId)})
               resolve()
           })
           
        })
    },
    OrderProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection('order').find({user:ObjectId(userId)}).toArray()
            resolve(orders)
        })
    },
    orderProDetails:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(orderId)
            let orderItems = await db.get().collection('order').aggregate([
                {
                    $match:{_id:ObjectId(orderId)},
                    
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:'product',
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },{
                    $project:{
                        quantity:1,item:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
           console.log(orderItems)
            resolve(orderItems)
        })
    }
    
}