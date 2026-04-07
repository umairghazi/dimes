import { Box, Typography, Alert, Stepper, Step, StepLabel } from "@mui/material";
import { useUpload } from "@/hooks/useUpload";
import { ColumnMapper } from "@/components/upload/ColumnMapper";
import { StagingReviewTable } from "@/components/upload/StagingReviewTable";

const STEPS = ["Pick Columns", "Review & Correct", "Confirmed"];

export function Upload() {
  const upload = useUpload();

  const activeStep = upload.step === "map" ? 0 : upload.step === "review" ? 1 : 2;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Import CSV</Typography>

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

      {upload.step === "review" && (
        <StagingReviewTable
          rows={upload.stagingRows}
          onCorrect={upload.correctCategory}
          onSkip={upload.skipRow}
          onConfirm={() => void upload.confirm()}
          onDiscard={() => void upload.discard()}
          loading={upload.loading}
          aiAvailable={upload.aiAvailable}
        />
      )}

      {upload.step === "done" && (
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={600} color="success.main" mb={2}>
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
