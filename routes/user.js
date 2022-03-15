const { response } = require('express');
var express = require('express');
const { redirect } = require('express/lib/response');
const async = require('hbs/lib/async');
const { request } = require('../app');
var router = express.Router();
var productHelper = require('../Helpers/product-helpers')
var userHelper = require('../Helpers/user-helpers')
const { check, validationResult } = require('express-validator');

//Login verfier
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
} 
//Signup Page
router.get('/signup', (req, res) => {
  if(req.session.loggedIn){
    res.render('user/signup',{'signupError':req.session.signupError})
    req.session.loggedIn = false
  }else{
    res.render('user/signup')
  }
  
})

router.post('/signup', (req, res) => {
  userHelper.addUser(req.body).then((response) => {
    if(response.user){
      req.session.loggedIn = true
      req.session.signupError='The Email id already exist'
      res.redirect('/signup')
    }else{ 
    res.redirect('/')
    }
  })
})
//LOGIN PAGE
router.get('/login', (req, res) => {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"logError":req.session.loginError})
    req.session.loginError=false
  }
})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginError=true
      res.redirect('/login')
    }
  })
})
/* GET home page. */
router.get('/',async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if(user){
  cartCount = await userHelper.cartCount(user._id)
}
  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { products,user,cartCount,"home":true })
  })

});
//LOGOUT
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.render('user/login')
})
//CART
router.get('/cart',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let total = await userHelper.getTotalAmount(req.session.user._id)
  let products = await userHelper.cartProduct(user._id)
  cartCount = await userHelper.cartCount(user._id)
    res.render('user/cart',{user,products,cartCount,total,"cart":true})
  
})
router.get('/add-to-cart/:id',(req,res)=>{
 userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
   res.json({status:true})
 })
})
router.post('/change-product-quantity',(req,res)=>{
  userHelper.changeQuantity(req.body).then(async(response)=>{
     response.total = await userHelper.getTotalAmount(req.session.user._id)
    res.json(response)
  })
})
router.post('/remove-product',(req,res)=>{
  userHelper.removeProduct(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/order-now',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let products = await userHelper.cartProduct(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  
  res.render('user/order-product',{total,products,user})
})
router.post('/order-now',async(req,res)=>{
  let products = await userHelper.cartproductList(req.body.userId)
  userHelper.checkoutDetails(req.body,products)
  res.json({status:true})
})
router.get('/order-placed',verifyLogin,async(req,res)=>{
  let products = await userHelper.cartProduct(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/order-placed',{total,products,"userName":req.session.user.Name})
})
router.get('/track-order',verifyLogin,async(req,res)=>{
  let order = await userHelper.OrderProduct(req.session.user._id)
  console.log(order._id)
  let orderProducts = await userHelper.orderProDetails(order._id)
  console.log(orderProducts)
  res.render('user/track-order',{order})
})
router.get('/order',verifyLogin,(req,res)=>{
  res.redirect('/track-order')
})
module.exports = router;
