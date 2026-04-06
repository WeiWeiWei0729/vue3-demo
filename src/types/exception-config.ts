export interface ExceptionDetail {
  id: number
  type: string
  reason: string
  roles: string[]
}

export interface ExceptionNodeConfig {
  id: number
  node: string
  details: ExceptionDetail[]
}

export interface EditableRow {
  nodeId: number
  detailId: number
  detailIndex: number
  rowSpan: number
  nodeRef: ExceptionNodeConfig
  detail: ExceptionDetail
}

export interface ListDisplayRow {
  id: number
  nodeId: number
  rowSpan: number
  node: string
  type: string
  reason: string
  roles: string
}
