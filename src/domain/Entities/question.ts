import { randomUUID } from "crypto"

interface Questionprops{
  title: string,
  content: string,
  authorId: string,
}

export class Questions {
  public id: string
  public title: string
  public content: string
  public authorId: string

  constructor(props: Questionprops, id?: string ) {
    this.title = props.title
    this.content = props.content
    this.authorId = props.authorId
    this.id = id ?? randomUUID()
  }
}