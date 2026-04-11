type ExceptionReasonItem = {
  id: string
  exceptionReason: string
  sort: number
  exceptionHandleUser: string[]
}

type ExceptionTypeItem = {
  id: string
  exceptionTypeCode: string | null
  exceptionTypeName: string
  sort: number
  exceptionReasonList: ExceptionReasonItem[]
}

type ExceptionNodeItem = {
  id: string
  exceptionNodeCode: string
  exceptionNodeName: string
  exceptionTypeVOList: ExceptionTypeItem[]
}

type PageListResponse = {
  code: number
  data: ExceptionNodeItem[]
  msg?: string
}

type DeleteResponse = {
  code: number
  msg?: string
}

type SaveResponse = {
  code: number
  message?: string
  msg?: string
}

export const pageList = async (_params?: unknown): Promise<PageListResponse> => {
  return {
    code: 0,
    data: [
      {
        id: '2042567933810114560',
        exceptionNodeCode: '1001',
        exceptionNodeName: '装货异常',
        exceptionTypeVOList: [
          {
            id: '2042567933835280384',
            exceptionTypeCode: null,
            exceptionTypeName: '测试1',
            sort: 0,
            exceptionReasonList: [
              {
                id: '2042567933894000640',
                exceptionReason: '测试1-1',
                sort: 0,
                exceptionHandleUser: ['下单人'],
              },
              {
                id: '2042567933927555072',
                exceptionReason: '测试1-2',
                sort: 0,
                exceptionHandleUser: ['发货人'],
              },
              {
                id: '2042567933961109504',
                exceptionReason: '测试1-3',
                sort: 0,
                exceptionHandleUser: ['调度员'],
              },
            ],
          },
        ],
      },
      {
        id: '2042567934057578496',
        exceptionNodeCode: '1003',
        exceptionNodeName: '卸货异常',
        exceptionTypeVOList: [
          {
            id: '2042567934091132928',
            exceptionTypeCode: null,
            exceptionTypeName: '测试2',
            sort: 0,
            exceptionReasonList: [
              {
                id: '2042567934154047488',
                exceptionReason: '测试2-1',
                sort: 0,
                exceptionHandleUser: ['下单人'],
              },
              {
                id: '2042567934187601920',
                exceptionReason: '测试2-2',
                sort: 0,
                exceptionHandleUser: ['下单人'],
              },
            ],
          },
        ],
      },
    ],
  }
}

export const delObj = async (_params?: unknown): Promise<DeleteResponse> => {
  return {
    code: 0,
    msg: 'ok',
  }
}

export const addObj = async (_params?: unknown): Promise<SaveResponse> => {
  return {
    code: 0,
    message: 'ok',
    msg: 'ok',
  }
}

export const updateObj = async (_params?: unknown): Promise<SaveResponse> => {
  return {
    code: 0,
    message: 'ok',
    msg: 'ok',
  }
}
