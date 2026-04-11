type DictItem = {
  label: string
  value: string
}

const dictMap: Record<string, DictItem[]> = {
  transportation_exception_type: [
    { label: '装卸异常', value: '1001' },
    { label: '运输异常', value: '1002' },
    { label: '卸货异常', value: '1003' },
  ],
}

export const useDict = (...keys: string[]) => {
  return keys.reduce<Record<string, DictItem[]>>((result, key) => {
    result[key] = dictMap[key] ?? []
    return result
  }, {})
}

export const useDictLabel = (key: string, value: string) => {
  const matched = (dictMap[key] ?? []).find((item) => item.value === value)
  return matched?.label ?? value ?? ''
}
