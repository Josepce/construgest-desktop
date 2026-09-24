const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes={};
const document={activeElement:null,addEventListener(){},getElementById:id=>nodes[id]||null};
for(const id of ['qProductSearch','qProduct','qPrice','qQty','qItemDiscount','qProductSearchHint','qCart','qTotalItems','qGross','qDiscountTotal','qGrand'])nodes[id]={value:'',textContent:'',setAttribute(){},focus(){document.activeElement=this}};
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
type('013307');assert.equal(nodes.qProduct.value,'1');assert.equal(nodes.qPrice.value,'4.50');enter();
assert.equal(vm.runInContext('quoteCart.length',context),1);assert.equal(vm.runInContext('quoteCart[0].qty',context),1);assert.equal(nodes.qProductSearch.value,'');assert.equal(document.activeElement,nodes.qProductSearch);
type('adaptador');assert.equal(nodes.qProduct.value,'');assert(nodes.qProductSuggestions.innerHTML.includes('ADAPTADOR 20MM'));
context.quoteSearchKey({key:'ArrowDown',preventDefault(){}});enter();assert.equal(vm.runInContext('quoteCart[1].product_id',context),2);
type('7891234567890');enter();assert.equal(vm.runInContext('quoteCart[0].qty',context),2);assert.equal(vm.runInContext('quoteCart.length',context),2);
type('inexistente');enter();assert(messages.includes('Produto não encontrado.'));assert.equal(vm.runInContext('quoteCart.length',context),2);
type('');assert.equal(nodes.qProductSuggestions.style.display,'none');
console.log('OK: busca por nome, código e EAN; Enter inclui e acumula itens; setas escolhem resultados; buscas vazias ou inexistentes não incluem itens.');
