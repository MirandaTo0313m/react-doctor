import { Box, Text } from "ink";
import { DIAGNOSTIC_LIST_VIEWPORT_ROWS } from "../constants.js";
import type { AppState } from "../types.js";
import { DiagnosticDetail } from "./diagnostic-detail.js";
import { DiagnosticList } from "./diagnostic-list.js";

interface ReviewViewProps {
  state: AppState;
}

export const ReviewView = ({ state }: ReviewViewProps) => {
  const selectedRule = state.groupedRules[state.selectedRuleIndex];
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box>
        <Text color="gray">Diagnostics</Text>
        <Text color="gray"> </Text>
        <Text color="white" bold>
          {state.filteredDiagnostics.length}
        </Text>
        <Text color="gray"> shown</Text>
        <Text color="gray"> · </Text>
        <Text color="gray">{state.diagnostics.length} total</Text>
        {state.filterText.length > 0 ? (
          <>
            <Text color="gray"> · filter: </Text>
            <Text color="cyan">{state.filterText}</Text>
          </>
        ) : null}
      </Box>
      <Box marginTop={1}>
        <Box flexDirection="column" width="42%">
          <DiagnosticList
            rules={state.groupedRules}
            selectedIndex={state.selectedRuleIndex}
            viewportHeight={DIAGNOSTIC_LIST_VIEWPORT_ROWS}
          />
        </Box>
        <Box flexDirection="column" width="58%" paddingLeft={1}>
          <DiagnosticDetail
            rule={selectedRule}
            selectedSiteIndex={state.selectedSiteIndex}
            rootDirectory={state.rootDirectory}
          />
        </Box>
      </Box>
    </Box>
  );
};
