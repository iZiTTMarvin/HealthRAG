interface DebugTogglesProps {
  showEntities: boolean;
  showIntent: boolean;
  showPrompt: boolean;
  onChange: (next: { showEntities: boolean; showIntent: boolean; showPrompt: boolean }) => void;
}

export default function DebugToggles({
  showEntities,
  showIntent,
  showPrompt,
  onChange
}: DebugTogglesProps) {
  return (
    <div className="debug-toggles">
      <label>
        <input
          type="checkbox"
          checked={showEntities}
          onChange={(event) =>
            onChange({ showEntities: event.target.checked, showIntent, showPrompt })
          }
        />
        显示实体识别结果
      </label>
      <label>
        <input
          type="checkbox"
          checked={showIntent}
          onChange={(event) =>
            onChange({ showEntities, showIntent: event.target.checked, showPrompt })
          }
        />
        显示意图识别结果
      </label>
      <label>
        <input
          type="checkbox"
          checked={showPrompt}
          onChange={(event) =>
            onChange({ showEntities, showIntent, showPrompt: event.target.checked })
          }
        />
        显示知识库信息
      </label>
    </div>
  );
}
