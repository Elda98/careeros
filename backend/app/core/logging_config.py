"""Structured (JSON) logging setup for the backend process.

Mirrors `careeros_ai.observability.log_event`'s structured-field approach
at the HTTP/service layer — request lifecycle, rate-limit rejections,
guardrail rejections — so both layers' logs are consistently parseable by
whatever log aggregator is watching stdout, without requiring one here.
"""

from __future__ import annotations

import json
import logging
import sys
import time


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": time.time(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    if root.handlers:
        # Already configured (e.g. re-imported under pytest) — don't stack
        # duplicate handlers, which would double-log every line.
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    root.addHandler(handler)
    root.setLevel(level)
