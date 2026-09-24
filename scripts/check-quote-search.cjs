const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes={};
const document={activeElement:null,addEventListener(){},getElementById:id=>nodes[id]||null};
for(const id of ['qProductSearch','qProduct','qPrice','qQty','qItemDiscount','qProductSearchHint','qCart','qTotalItems','qGross','qDiscountTotal','qGrand'])nodes[id]={value:'',textContent:'',setAttribute(){},focus(){document.activeElement=this},select(){}};
nodes.qProductSuggestions={style:{display:'none'},innerHTML:'',querySelectorAll(){return []},querySelector(){return null}};
const messages=[];
const context={localStorage:{},window:{},document,fetch:()=>new Promise(()=>{}),setTimeout(){},setInterval(){},Intl,URL,console,toast:s=>messages.push(s)};
vm.createContext(context);vm.runInContext(fs.readFileSync('public/app.js','utf8'),context);context.toast=s=>messages.push(s);
const products=[{id:1,code:'013307',ean:'7891234567890',name:'ADAPTADOR 20MM X 1/2',retail:4.5},{id:2,code:'000625',name:'ADAPTADOR 25MM X 3/4',retail:8},{id:3,code:'003626',name:'Lâmpada LED 9W',retail:10}];context.window._quoteProducts=products;context._quoteProducts=products;
for(const id of ['qQty','qPrice','qItemDiscount'])context[id]=nodes[id];nodes.qQty.value='1';nodes.qItemDiscount.value='0';
assert.equal(context.findQuoteProducts(products,'lampada').selected.id,3);
assert.equal(context.findQuoteProducts(products,'013307').selected.id,1);
assert.equal(context.findQuoteProducts(products,'7891234567890').selected.id,1);
assert.equal(context.findQuoteProducts(products,'20mm adaptador').selected.id,1);
assert.equal(context.findQuoteProducts(products,'adaptador').selected,null);
function type(value){nodes.qProductSearch.value=value;context.filterQuoteProducts()}
function enter(){let prevented=false;context.quoteSearchKey({key:'Enter',preventDefault(){prevented=true}});assert(prevented)}
function fieldEnter(nextId){let prevented=false;context.quoteFieldKey({key:'Enter',preventDefault(){prevented=true}},nextId);assert(prevented)}
type('013307');assert.equal(nodes.qProduct.value,'1');assert.equal(nodes.qPrice.value,'4.50');enter();
assert.equal(vm.runInContext('quoteCart.length',context),0);assert.equal(document.activeElement,nodes.qQty);
nodes.qQty.value='3';fieldEnter('qPrice');assert.equal(document.activeElement,nodes.qPrice);
nodes.qPrice.value='5.75';fieldEnter('qItemDiscount');assert.equal(document.activeElement,nodes.qItemDiscount);
nodes.qItemDiscount.value='10';fieldEnter();
assert.equal(vm.runInContext('quoteCart.length',context),1);assert.equal(vm.runInContext('quoteCart[0].qty',context),3);assert.equal(vm.runInContext('quoteCart[0].unit_price',context),5.75);assert.equal(vm.runInContext('quoteCart[0].discount_percent',context),10);assert.equal(nodes.qProductSearch.value,'');assert.equal(document.activeElement,nodes.qProductSearch);
type('adaptador');assert.equal(nodes.qProduct.value,'');assert(nodes.qProductSuggestions.innerHTML.includes('ADAPTADOR 20MM'));
context.quoteSearchKey({key:'ArrowDown',preventDefault(){}});enter();fieldEnter('qPrice');fieldEnter('qItemDiscount');fieldEnter();assert.equal(vm.runInContext('quoteCart[1].product_id',context),2);
type('7891234567890');enter();fieldEnter('qPrice');fieldEnter('qItemDiscount');fieldEnter();assert.equal(vm.runInContext('quoteCart[0].qty',context),4);assert.equal(vm.runInContext('quoteCart.length',context),2);
type('inexistente');enter();assert(messages.includes('Produto não encontrado.'));assert.equal(vm.runInContext('quoteCart.length',context),2);
type('');assert.equal(nodes.qProductSuggestions.style.display,'none');
console.log('OK: busca por nome, código e EAN; Enter avança por quantidade, preço e desconto antes de incluir; setas escolhem resultados; buscas inválidas não incluem itens.');
