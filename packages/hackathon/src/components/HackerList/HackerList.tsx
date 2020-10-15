/*

 MIT License

 Copyright (c) 2020 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */
import React, { FC, useState } from 'react'
import {
  ActionList,
  ActionListItem,
  ActionListItemColumn,
  Pagination,
} from '@looker/components'
// import { getExtensionSDK } from '@looker/extension-sdk'
import { Hacker, Hackers, sheetCell, sheetHeader } from '../../models'

interface HackerListProps {
  /** All hackers object */
  hackers: Hackers
  /** hacker group. Defaults to all */
  list?: Hacker[]
}

// TODO click on user id should go to the user editing admin page

// getExtensionSDK().openBrowserWindow(project.more_info, '_blank')
// const handleMoreInfo = (project: Project) => {
//   getExtensionSDK().openBrowserWindow(project.more_info, '_blank')
//   dispatch(deleteProjectRequest(projects, project))
// }
// const handleMoreInfo = (project: Project) => {
//   getExtensionSDK().openBrowserWindow(project.more_info, '_blank')
// }
//
// const hackerCell = (key: string, value: any) => {
//   if (key !== 'id') return sheetCell(value)
//   const userLink = `/admin/users/${value}/edit`
//   return (
//     <Link key={key} href={userLink} target="_blank">
//       {value}
//     </Link>
//   )
// }

export const HackerList: FC<HackerListProps> = ({ hackers, list }) => {
  const [currentPage, setCurrentPage] = useState(1)
  if (!list) list = hackers.rows
  const template = hackers.rows.length === 0 ? new Hacker() : hackers.rows[0]
  const header = hackers.displayHeaders
  const columns = sheetHeader(header, template)

  const pageSize = 25
  const totalPages = Math.ceil(list.length / pageSize)

  const startIdx = (currentPage - 1) * pageSize
  const rows = list.slice(startIdx, startIdx + pageSize).map((hacker, idx) => (
    <ActionListItem key={idx} id={idx.toString()}>
      {header.map((columnName, _) => (
        <ActionListItemColumn key={`${idx}.${columnName}`}>
          {sheetCell(hacker[columnName])}
        </ActionListItemColumn>
      ))}
    </ActionListItem>
  ))

  return (
    <>
      <ActionList columns={columns}>{rows}</ActionList>
      <Pagination
        current={currentPage}
        pages={totalPages}
        onChange={setCurrentPage}
      />
    </>
  )
}
