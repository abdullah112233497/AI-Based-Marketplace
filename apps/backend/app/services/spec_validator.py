from typing import Any, Dict
from app.core.exceptions import AppException


def validate_category_specs(
    spec_schema: Dict[str, Any],
    specs: Dict[str, Any],
    enforce_required: bool = False,
) -> Dict[str, Any]:
    """
    Validates dynamic specifications against the Category's specification schema.
    Ensures required fields are present (when enforce_required=True) and
    option constraints are strictly respected.
    """
    if not spec_schema or "fields" not in spec_schema:
        return specs or {}

    fields = spec_schema.get("fields", [])
    specs_dict = specs or {}
    cleaned_specs: Dict[str, Any] = {}

    for field in fields:
        key = field.get("key")
        label = field.get("label", key)
        required = field.get("required", False)
        options = field.get("options")

        val = specs_dict.get(key)

        # Check required if requested
        if enforce_required and required and (val is None or str(val).strip() == ""):
            raise AppException(
                message=f"Missing required specification field: '{label}' ({key})",
                code="INVALID_SPECS",
                status_code=422,
                details={"field": key, "label": label},
            )

        if val is not None and str(val).strip() != "":
            # Validate options if defined
            if options and isinstance(options, list) and len(options) > 0:
                allowed_opts = [str(opt).strip().lower() for opt in options]
                if str(val).strip().lower() not in allowed_opts:
                    raise AppException(
                        message=f"Invalid value '{val}' for spec '{label}'. Allowed: {', '.join(options)}",
                        code="INVALID_SPECS",
                        status_code=422,
                        details={"field": key, "allowedOptions": options, "providedValue": val},
                    )

            cleaned_specs[key] = val

    # Retain any additional non-conflicting specs provided
    for k, v in specs_dict.items():
        if k not in cleaned_specs and v is not None:
            cleaned_specs[k] = v

    return cleaned_specs
