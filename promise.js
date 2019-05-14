const STATUS='pending';//初始状态
const REJECT='reject';//失败
function myPromise(exector){

  //缓存当前this
  let self=this;

  //设定初始状态
  self.status=STATUS;

  //设定存放成功的回调的数组
  self.onResolveCallback=[];

  //设定存放失败的回调的数组
  self.onRejectCallback=[];

  //self.status为pending转成成功 如果已经成功或失败就忽略
  function resolve(value){
    //初始态转成成功态
    if(self.status==STATUS){
      self.status="";//初始态转成成功态
      self.value=value;//成功后存入value,并且要执行所有的回调函数
      self.onResolveCallback.forEach(cb=>cb(self.value))
    }

  }

  //self.status为pending转成失败 如果已经成功或失败就忽略
  function reject(value){
    if(self.status==STATUS){
      self.status=REJECT;
      self.value=value;//成功后存入value,并且要执行所有的回调函数
      self.onRejectCallback.forEach(cb=>cb(self.value))
    }

  }

  //exector执行可能会出异常 需要捕获错误 如果错误了回调reject
  try{
    exector(resolve,reject)
  }catch(e){
    reject(e)
  }

}

//解析then后的回调
function resovlePromise(promise,x,resolve,reject){
  //promise 与return x一样的 会没有完成的return 值
  if(promise==x){
    return reject(new TypeError('循环引用'))
  }
  if(x instanceof myPromise){
    if(x.status=='pending'){
      x.then((y)=>{
        resovlePromise(promise,y,resolve,reject)
      },reject)
    }else{
      x.then(resolve,reject)
    }
  }else if(x!=null && ((typeof x=='object')|| (typeof x=='function'))){
    //x是个then或者对象函数 只有then方法
    try {
      //promise与别人的传进的promise函数中进行交互，最大容忍别人写法
      let then=x.then;
      if(typeof then=='function'){
        then.call(x,(y)=>{
          resovlePromise(promise,y,resolve,reject);//y还可能是Promsie
        },(err)=>{
          reject(err)
        })
      }else{
        //到此的话x不是一个thenable（是对象），直接resolve(x)
        resolve(x)
      }
    } catch (error) {
      reject(error)
    }

  }else{
    //返回的是普通值直接传入下个resolve
    resolve(x)
  }
}

//接收成功或失败的原因
myPromise.prototype.then=function(onFulfiled,onRejected){
  onFulfiled=typeof onFulfiled=='function'?onFulfiled:value=>value;
  onRejected=typeof onRejected=='function'?onRejected:value=>{throw value};
  let self=this;
  let promise2;
  if(self.status==""){
    //成功回调了 链式写法
    return promise2=new myPromise(function(resolve,reject){
      try {
        let x=onFulfiled(self.value);//必须返回值，传入链式调用的下个then中
        //如果获取到的返回值x会走promise的过程
        resovlePromise(promise2,x,resolve,reject)
      } catch (error) {
        reject(error)
      }
      
    })    
  }else if(self.status==REJECT){
    try {
      //失败
      let x=onRejected(self.value);//必须返回值，传入链式调用的下个then中
      //如果获取到的返回值x会走promise的过程
      resovlePromise(promise2,x,resolve,reject)
    } catch (error) {
      reject(error)
    }
    
  }else{
    try {
      
    } catch (error) {
      
    }
    //初始 存入成功callback
    self.onResolveCallback.push(()=>{
      let x=onFulfiled(self.value);//必须返回值，传入链式调用的下个then中
      //如果获取到的返回值x会走promise的过程
      resovlePromise(promise2,x,resolve,reject)
    });
    //初始 存入失败callback
    self.onRejectCallback.push(()=>{
      let x=onRejected(self.value);//必须返回值，传入链式调用的下个then中
      //如果获取到的返回值x会走promise的过程
      resovlePromise(promise2,x,resolve,reject)
    });
  }
}
//调用
let p=new myPromise(function(resolve,reject){
  setTimeout(()=>{
    let num=Math.random()*10;
    console.log(num)
    if(num<5.5){
      resolve(num)
    }else{
      reject('失败')
    }
  })
})
p.then((data)=>{
  console.log(data)
},(data)=>{
  console.log(data)
})
