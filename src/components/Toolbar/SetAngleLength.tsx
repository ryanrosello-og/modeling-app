import { useState, useEffect } from 'react'
import { create } from 'react-modal-promise'
import { toolTips, useStore } from '../../useStore'
import { Value } from '../../lang/abstractSyntaxTree'
import {
  getNodePathFromSourceRange,
  getNodeFromPath,
  findAllPreviousVariables,
} from '../../lang/queryAst'
import {
  TransformInfo,
  getTransformInfos,
  transformAstSketchLines,
} from '../../lang/std/sketchcombos'
import { SetAngleLengthModal } from '../SetAngleModal'
import {
  createIdentifier,
  createVariableDeclaration,
} from '../../lang/modifyAst'

const getModalInfo = create(SetAngleLengthModal as any)

export const SetAngleLength = ({
  angleOrLength,
}: {
  angleOrLength: 'setAngle' | 'setLength'
}) => {
  const { guiMode, selectionRanges, ast, programMemory, updateAst } = useStore(
    (s) => ({
      guiMode: s.guiMode,
      ast: s.ast,
      updateAst: s.updateAst,
      selectionRanges: s.selectionRanges,
      programMemory: s.programMemory,
    })
  )
  const [enableHorz, setEnableHorz] = useState(false)
  const [transformInfos, setTransformInfos] = useState<TransformInfo[]>()
  useEffect(() => {
    if (!ast) return
    const paths = selectionRanges.map((selectionRange) =>
      getNodePathFromSourceRange(ast, selectionRange)
    )
    const nodes = paths.map(
      (pathToNode) => getNodeFromPath<Value>(ast, pathToNode).node
    )
    const isAllTooltips = nodes.every(
      (node) =>
        node?.type === 'CallExpression' &&
        toolTips.includes(node.callee.name as any)
    )

    const theTransforms = getTransformInfos(selectionRanges, ast, angleOrLength)
    setTransformInfos(theTransforms)

    const _enableHorz = isAllTooltips && theTransforms.every(Boolean)
    setEnableHorz(_enableHorz)
  }, [guiMode, selectionRanges])
  if (guiMode.mode !== 'sketch') return null

  return (
    <button
      onClick={async () => {
        if (!(transformInfos && ast)) return
        const { modifiedAst, valueUsedInTransform } = transformAstSketchLines({
          ast: JSON.parse(JSON.stringify(ast)),
          selectionRanges,
          transformInfos,
          programMemory,
          referenceSegName: '',
        })
        const availableVarInfo = findAllPreviousVariables(
          modifiedAst,
          programMemory,
          selectionRanges[0]
        )

        try {
          const { valueNode, variableName } = await getModalInfo({
            value: valueUsedInTransform,
            prevVariables: availableVarInfo.variables,
            valueName: angleOrLength === 'setAngle' ? 'angle' : 'length',
          } as any)

          const { modifiedAst: _modifiedAst } = transformAstSketchLines({
            ast: JSON.parse(JSON.stringify(ast)),
            selectionRanges,
            transformInfos,
            programMemory,
            referenceSegName: '',
            forceValueUsedInTransform: variableName
              ? createIdentifier(variableName)
              : valueNode,
          })
          if (variableName) {
            const newBody = [..._modifiedAst.body]
            newBody.splice(
              availableVarInfo.insertIndex,
              0,
              createVariableDeclaration(variableName, valueNode)
            )
            _modifiedAst.body = newBody
          }

          updateAst(_modifiedAst)
        } catch (e) {
          console.log('e', e)
        }
      }}
      className={`border m-1 px-1 rounded text-xs ${
        enableHorz ? 'bg-gray-50 text-gray-800' : 'bg-gray-200 text-gray-400'
      }`}
      disabled={!enableHorz}
    >
      {angleOrLength}
    </button>
  )
}