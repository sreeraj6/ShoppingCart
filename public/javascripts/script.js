const { response } = require("../../app")

function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        methhod:'get',
        success:(response)=>{
            if(response.status){
                let count = $('#cart-count').html()
                count = parseInt(count)+1
                $('#cart-count').html(count) 
            }
        }
    })
}
function changeQuantity(cartId,prodId,userId,count){
    let quantity=parseInt(document.getElementById(prodId).innerHTML)
    count=parseInt(count)
    $.ajax({
      url:'/change-product-quantity',
      data:{
        user:userId,
        cart:cartId,
        product:prodId,
        count:count,
        quantity:quantity
      },
      method:'POST',
      success:((response)=>{
         if(response.removeProduct){
           alert("product removed from cart"),
           location.reload()
         }else{
           document.getElementById(prodId).innerHTML=quantity+count
           document.getElementById('total').innerHTML=response.total
         }
      })
    })
}
function removeItem(cartId,prodId){
    $.ajax({
      url:'/remove-product',
      data:{
        cart:cartId,
        product:prodId
      },
      method:'POST',
      success:((response)=>{
        alert('product removed')
        location.reload()
      })
    })
}



