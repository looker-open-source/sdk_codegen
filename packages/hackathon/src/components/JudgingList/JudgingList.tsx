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
  ActionListItemAction,
  ActionListItemColumn,
  Pagination,
  Dialog,
  DialogHeader,
  DialogContent,
  Paragraph,
  SpaceVertical,
  TextArea,
  Tooltip,
} from '@looker/components'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Judging, sheetCell, sheetHeader } from '../../models'
import { getHackerState } from '../../data/hack_session/selectors'

const judgingListheaders = [
  '$judge_name',
  '$title',
  'execution',
  'ambition',
  'coolness',
  'impact',
  'score',
  'notes',
]

interface JudgingListProps {
  judgings: Judging[]
}

export const JudgingList: FC<JudgingListProps> = ({ judgings }) => {
  const history = useHistory()
  const template = judgings.length > 0 ? judgings[0] : new Judging()
  const [currentPage, setCurrentPage] = useState(1)
  const [moreInfo, setMoreInfo] = useState<string>()
  const [title, setTitle] = useState<string>()
  // Select only the displayable columns
  const header = judgingListheaders
  const columns = sheetHeader(header, template)
  const hacker = useSelector(getHackerState)
  // const dispatch = useDispatch()

  const openMoreInfo = (judging: Judging) => {
    setMoreInfo(judging.$more_info)
    setTitle(judging.$title)
  }

  const closeMoreInfo = () => {
    setMoreInfo(undefined)
    setTitle(undefined)
  }

  columns[0].title = (
    <Tooltip content={'The judge assigned to this project'}>Judge</Tooltip>
  )
  // columns[1].widthPercent = 3
  // columns[1].title = (
  //   <Tooltip content={'Eligible for prizing?'}>
  //     <Icon name="FactCheck" />
  //   </Tooltip>
  // )
  // columns[2].widthPercent = 25 // title
  // columns[3].widthPercent = 40 // description
  // columns[4].widthPercent = 5 // judging type
  // columns[4].title = (
  //   <Tooltip content="Open: anyone can join. Closed: no more members. Invite only: ask to join">
  //     <SpaceVertical gap="xxsmall">
  //       <Span>Judging</Span>
  //       <Span>Type</Span>
  //     </SpaceVertical>
  //   </Tooltip>
  // )
  // columns[5].widthPercent = 15 // technologies
  // columns[6].widthPercent = 5 // team count
  // columns[6].title = (
  //   <Tooltip content="member count/maximum allowed">
  //     <SpaceVertical gap="xxsmall">
  //       <Span>Team</Span>
  //       <Span>Count</Span>
  //     </SpaceVertical>
  //   </Tooltip>
  // )
  // columns[7].widthPercent = 5 // judge count
  // columns[7].title = (
  //   <Tooltip content="Number of judges assigned">
  //     <SpaceVertical gap="xxsmall">
  //       <Span>Judge</Span>
  //       <Span>Count</Span>
  //     </SpaceVertical>
  //   </Tooltip>
  // )

  const showJudging = (judgingId: string) => {
    setTimeout(() => {
      history.push(`/judging/${judgingId}`)
    })
  }

  const actions = (judging: Judging) => {
    return (
      <>
        {judging.$more_info && judging.$more_info !== '\0' && (
          <ActionListItemAction
            onClick={openMoreInfo.bind(null, judging)}
            icon="CircleInfo"
          >
            More Information
          </ActionListItemAction>
        )}
        <ActionListItemAction
          onClick={showJudging.bind(null, judging._id)}
          icon="Edit"
          itemRole="link"
        >
          {judging.canUpdate(hacker) ? 'Edit' : 'View'}
        </ActionListItemAction>
      </>
    )
  }

  judgings.forEach((j) => j.load())
  const pageSize = 25
  const totalPages = Math.ceil(judgings.length / pageSize)

  const startIdx = (currentPage - 1) * pageSize
  const rows = judgings
    .slice(startIdx, startIdx + pageSize)
    .map((judging, idx) => (
      <ActionListItem
        key={idx}
        id={idx.toString()}
        actions={actions(judging as Judging)}
      >
        {header.map((columnName, _) => (
          <ActionListItemColumn key={`${idx}.${columnName}`}>
            {sheetCell(judging[columnName])}
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
      <Dialog isOpen={!!moreInfo} onClose={closeMoreInfo}>
        <DialogHeader>{title}</DialogHeader>
        <DialogContent>
          <SpaceVertical>
            <Paragraph>
              Copy the link below and paste into a new browser window to see
              additional information about the project
            </Paragraph>
            <TextArea readOnly={true} value={moreInfo}></TextArea>
          </SpaceVertical>
        </DialogContent>
      </Dialog>
    </>
  )
}