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
import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isLoadingState } from '../../data/common/selectors'
import { getHackerState } from '../../data/hack_session/selectors'
import { Loading } from '../../components/Loading'
import { JudgingList } from '../../components/JudgingList'
import { allJudgingsRequest } from '../../data/judgings/actions'
import { getJudgingsListState } from '../../data/judgings/selectors'
import { Judging } from '../../models'

interface JudgingSceneProps {}

export const JudgingScene: FC<JudgingSceneProps> = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(allJudgingsRequest())
  }, [dispatch])
  const hacker = useSelector(getHackerState)
  const judgings = useSelector(getJudgingsListState)
  const isLoading = useSelector(isLoadingState)
  let list: Judging[] = []
  if (judgings) {
    if (hacker.canAdmin) {
      list = judgings
    } else if (hacker.canJudge) {
      list = judgings.filter((j) => j.user_id === hacker.id)
    }
  }

  return (
    <>
      <Loading loading={isLoading} message={'Processing judgings...'} />
      {list && <JudgingList judgings={list} />}
    </>
  )
}
