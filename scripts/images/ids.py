from __future__ import annotations


def image_id(source: str | None, path_id: int | str | None) -> str | None:
    if not source or path_id is None:
        return None
    return f"{source}:{int(path_id)}"
