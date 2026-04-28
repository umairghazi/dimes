import { Box, Typography, Alert, Stepper, Step, StepLabel, LinearProgress } from "@mui/material";
import { useUpload } from "@/hooks/useUpload";
import { ColumnMapper } from "@/components/upload/ColumnMapper";
import { StagingReviewTable } from "@/components/upload/StagingReviewTable";

const STEPS = ["Pick Columns", "Classifying", "Review & Correct", "Done"];

export function Upload() {
  const upload = useUpload();

  const activeStep =
    upload.step === "map" ? 0
    : upload.step === "processing" ? 1
    : upload.step === "review" ? 2
    : 3;

  const { classified = 0, total = 0 } = upload.progress ?? {};
  const percent = total > 0 ? Math.round((classified / total) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Import CSV</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {upload.error && <Alert severity="error" sx={{ mb: 2 }}>{upload.error}</Alert>}

      {upload.step === "map" && (
        <ColumnMapper onSubmit={upload.uploadCSV} loading={upload.loading} />
      )}

      {upload.step === "processing" && (
        <Box sx={{ textAlign: "center", py: 8, maxWidth: 480, mx: "auto" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Classifying transactions…
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            AI is categorising your transactions in the background.
          </Typography>

          <LinearProgress
            variant={total > 0 ? "determinate" : "indeterminate"}
            value={percent}
            sx={{ borderRadius: 4, height: 8, mb: 1.5 }}
          />
          {total > 0 && (
            <Typography variant="caption" color="text.secondary">
              {classified} of {total} classified ({percent}%)
            </Typography>
          )}
        </Box>
      )}

      {upload.step === "review" && (
        <StagingReviewTable
          rows={upload.stagingRows}
          onCorrect={upload.correctCategory}
          onEditDescription={(id, desc) => void upload.editDescription(id, desc)}
          onSplit={(id, splits) => void upload.splitRow(id, splits)}
          onSkip={upload.skipRow}
          onConfirm={() => void upload.confirm()}
          onDiscard={() => void upload.discard()}
          loading={upload.loading}
          aiAvailable={upload.aiAvailable}
        />
      )}

      {upload.step === "done" && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h5" color="success.main" sx={{ fontWeight: 600, mb: 2 }}>
            Import complete!
          </Typography>
          <Typography color="text.secondary">
            Your transactions have been imported successfully.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
