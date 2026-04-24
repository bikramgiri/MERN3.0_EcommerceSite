
const findData = async (model: any, field: string, query: string) => {
  const [result] = await model.findAll({
    where: { [field]: query }  
  })
  return result
}

export default findData