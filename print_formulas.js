const XLSX=require('xlsx');
const f=process.argv[2];
if(!f){console.error('usage: node print_formulas.js <file.xlsx>');process.exit(1);}
try{
  const wb=XLSX.readFile(f,{cellNF:true,cellFormula:true});
  console.log('***',f,'***');
  console.log('Sheets:',wb.SheetNames);
  wb.SheetNames.forEach(name=>{
    const ws=wb.Sheets[name];
    const out=[];
    for(const R in ws){
      if(R[0]==='!') continue;
      const cell=ws[R];
      if(cell.f) out.push(`${R}: ${cell.f}`);
    }
    console.log('Formulas in',name,out.slice(0,50));
  });
}catch(e){console.error('error reading',f,e);}
