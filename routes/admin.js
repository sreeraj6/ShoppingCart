const { response } = require('express');
var express = require('express');
const { render } = require('express/lib/response');
var router = express.Router();
var productHelper = require('../Helpers/product-helpers')
var userHelper = require('../Helpers/user-helpers');
const { route } = require('./user');

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render('admin/product-panel', { products, admin: true })
  })

});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
})


router.post('/add-product', (req, res) => {
  productHelper.addProduct(req.body, (id) => {

    let image = req.files.image;
    image.mv('./public/images/' + id + '.png', (err, done) => {
      if (!err) {
        res.render('admin/add-product')
      }

    })

      res.redirect('/admin'), { admin: true }
  })
})
router.get('/product-delete/:id', (req, res) => {
  let proId = req.params.id
  productHelper.deleteProduct(proId).then((response) => {
    console.log(response)
    res.redirect('/admin/')
  })
})
router.get('/product-edit/:id', (req, res) => {
  let proId = req.params.id
  productHelper.getProductDetail(proId).then((product) => {
    res.render('admin/edit-product', { product,admin:true })
  })
})
router.post('/product-edit/:id',(req,res)=>{
  console.log(req.params.id)
 productHelper.updateProduct(req.params.id,req.body).then(()=>{
   res.redirect('/admin')
  if(req.files.image){
    let image = req.files.image;
    image.mv('./public/images/' + req.params.id + '.png')
  }
 })
})

router.get('/admin/all-user', (req, res) => {
  console.log('123')
    res.render('admin/all-users', {admin: true })
  })



module.exports = router;
